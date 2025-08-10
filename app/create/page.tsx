"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { config } from "@/lib/wagmi";
import { FACTORIES, DEFAULT_COLLATERAL, DEFAULT_ORACLE } from "@/lib/contracts";
import {
  ERC20_ABI,
  BINARY_FACTORY_ABI,
  CATEGORICAL_FACTORY_ABI,
  SCALAR_FACTORY_ABI,
  KAS_ORACLE_ABI,
} from "@/lib/abis";
import { decodeEventLog, keccak256, toHex } from "viem";

import GlassCard from "@/components/ui/glass-card";
import { OutlineButton } from "@/components/ui/gradient-outline";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Hex = `0x${string}`;

function InfoTip({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/90">{label}</span>
      <TooltipProvider>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <span className="cursor-help text-white/70 hover:text-white">ⓘ</span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            sideOffset={10}
            collisionPadding={32}
            className="max-w-[320px] bg-neutral-900/85 text-white/90 backdrop-blur-xl rounded-xl border p-4 shadow-2xl z-50"
            style={{ borderImage: "linear-gradient(135deg, #49EACB, #7C3AED) 1" }}
          >
            <div className="text-xs leading-relaxed">{tip}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function CreatePage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  // Form state
  const [marketType, setMarketType] = useState<'binary' | 'categorical' | 'scalar'>('binary');
  const [marketName, setMarketName] = useState<string>(""); 
  const [numOutcomes, setNumOutcomes] = useState<number>(3);
  const [outcomeNames, setOutcomeNames] = useState<string>("A,B,C");
  const [scalarMin, setScalarMin] = useState<string>("0");
  const [scalarMax, setScalarMax] = useState<string>("100");
  const [scalarDecimals, setScalarDecimals] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);

  const selectedFactory: Hex | undefined = useMemo(() => {
    if (!FACTORIES) return undefined as any;
    if (marketType === 'binary') return FACTORIES.binary as Hex;
    if (marketType === 'categorical') return FACTORIES.categorical as Hex;
    return FACTORIES.scalar as Hex;
  }, [marketType]);

  // Guard missing addresses
  if (!DEFAULT_ORACLE || !DEFAULT_COLLATERAL) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Configuration Missing</h2>
          <p className="text-sm text-white/70">
            Please set NEXT_PUBLIC_DEFAULT_ORACLE and NEXT_PUBLIC_DEFAULT_COLLATERAL.
          </p>
        </GlassCard>
      </div>
    );
  }

  async function handleCreate() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!isConnected || !address) {
        toast({ title: "Connect wallet", description: "Please connect your wallet to continue." });
        return;
      }
      if (!selectedFactory) {
        toast({ title: "Missing factory", description: "No factory for selected market type." });
        return;
      }

      // 1) Read questionFee and bondToken
      const [qFee, qBondToken] = await Promise.all([
        config.publicClient.readContract({
          address: DEFAULT_ORACLE as Hex,
          abi: KAS_ORACLE_ABI,
          functionName: 'questionFee',
          args: [],
        }),
        config.publicClient.readContract({
          address: DEFAULT_ORACLE as Hex,
          abi: KAS_ORACLE_ABI,
          functionName: 'bondToken',
          args: [],
        }),
      ]) as [bigint, Hex];

      // 2) Approve Oracle to pull the fee (should prompt wallet)
      if (qFee > 0n) {
        const approveHash = await writeContractAsync({
          chainId,
          address: qBondToken,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [DEFAULT_ORACLE as Hex, qFee],
        }) as Hex;
        await config.publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 3) Build params for oracle
      const now = Math.floor(Date.now() / 1000);
      const template = marketName || 'Untitled';
      const templateHash = keccak256(toHex(template));
      const timeout = 24 * 60 * 60;
      const bondMultiplier = 2;
      const maxRounds = 5;
      const openingTs = BigInt(now + 60 * 60);

      const params: any =
        marketType === 'binary'
          ? { qtype: 0, options: 2, scalarMin: 0n, scalarMax: 0n, scalarDecimals: 0, timeout, bondMultiplier, maxRounds, templateHash, dataSource: 'user', consumer: '0x0000000000000000000000000000000000000000', openingTs }
          : marketType === 'categorical'
          ? { qtype: 1, options: Number(numOutcomes), scalarMin: 0n, scalarMax: 0n, scalarDecimals: 0, timeout, bondMultiplier, maxRounds, templateHash, dataSource: 'user', consumer: '0x0000000000000000000000000000000000000000', openingTs }
          : { qtype: 2, options: 0, scalarMin: BigInt(scalarMin || '0'), scalarMax: BigInt(scalarMax || '0'), scalarDecimals: Number(scalarDecimals || 0), timeout, bondMultiplier, maxRounds, templateHash, dataSource: 'user', consumer: '0x0000000000000000000000000000000000000000', openingTs };

      const salt = keccak256(toHex(String(Date.now()) + address));

      // 4) Create question on oracle
      const qHash = await writeContractAsync({
        chainId,
        address: DEFAULT_ORACLE as Hex,
        abi: KAS_ORACLE_ABI,
        functionName: 'createQuestionPublic',
        args: [params, salt],
      }) as Hex;
      const qReceipt = await config.publicClient.waitForTransactionReceipt({ hash: qHash });

      // 5) Extract questionId
      let questionId: Hex | undefined = undefined;
      for (const log of qReceipt.logs) {
        try {
          const parsed: any = decodeEventLog({
            abi: KAS_ORACLE_ABI as any,
            data: log.data as Hex,
            topics: log.topics as readonly Hex[],
          });
          if (parsed.eventName === 'QuestionCreated') {
            questionId = parsed.args?.id as Hex;
            break;
          }
        } catch {}
      }
      if (!questionId) {
        toast({ title: 'Oracle error', description: 'Could not obtain questionId from events.' });
        return;
      }

      // 6) Submit market (prompts wallet)
      let submitHash: Hex | undefined = undefined;
      if (marketType === 'binary') {
        submitHash = await writeContractAsync({
          chainId,
          address: selectedFactory,
          abi: BINARY_FACTORY_ABI,
          functionName: 'submitBinary',
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, template],
        }) as Hex;
      } else if (marketType === 'categorical') {
        const count = Number(numOutcomes);
        const namesArray = outcomeNames.split(',').map(s => s.trim()).filter(Boolean);
        if (namesArray.length !== count) {
          toast({ title: 'Input mismatch', description: 'Outcome names must match the number of outcomes.' });
          return;
        }
        submitHash = await writeContractAsync({
          chainId,
          address: selectedFactory,
          abi: CATEGORICAL_FACTORY_ABI,
          functionName: 'submitCategorical',
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, template, count, namesArray],
        }) as Hex;
      } else {
        submitHash = await writeContractAsync({
          chainId,
          address: selectedFactory,
          abi: SCALAR_FACTORY_ABI,
          functionName: 'submitScalar',
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, template, BigInt(scalarMin || '0'), BigInt(scalarMax || '0'), Number(scalarDecimals || 0)],
        }) as Hex;
      }
      await config.publicClient.waitForTransactionReceipt({ hash: submitHash as Hex });

      toast({ title: 'Market created', description: 'Transaction confirmed. Check your portfolio or explorer.' });
    } catch (err: any) {
      toast({ title: 'Create failed', description: err?.shortMessage || err?.message || 'Unknown error' });
    } finally {
      setSubmitting(false);
    }
  }

  // --- UI ---
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center p-6">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to create a market.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Main Create card */}
      <GlassCard className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
            Create Prediction Market
          </h1>
          <p className="text-gray-400 text-sm">Pay the creation fee and deploy a Binary, Categorical, or Scalar market.</p>
        </div>

        {/* Market type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative">
          <div>
            <InfoTip
              label="Market Type"
              tip="Binary = Yes/No. Categorical = two or more named outcomes. Scalar = numeric result within a range."
            />
          </div>
          <div className="md:col-span-2">
            <Select value={marketType} onValueChange={(v) => setMarketType(v as any)}>
              <SelectTrigger className="w-full bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg text-white">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 backdrop-blur-xl border border-white/10 text-white">
                <SelectItem value="binary">Binary (Yes/No)</SelectItem>
                <SelectItem value="categorical">Categorical (2+)</SelectItem>
                <SelectItem value="scalar">Scalar (range)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Market name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative">
          <div>
            <InfoTip
              label="Market Name"
              tip="A short human-friendly title. Included in the oracle template hash."
            />
          </div>
          <input
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            placeholder="e.g., Will BTC close above $90k on Dec 31?"
            className="md:col-span-2 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
          />
        </div>

        {/* Categorical fields */}
        {marketType === 'categorical' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <InfoTip label="# of Outcomes" tip="Total number of outcome tokens to create for this market." />
              </div>
              <input
                type="number"
                min={2}
                value={numOutcomes}
                onChange={(e) => setNumOutcomes(parseInt(e.target.value || '2', 10))}
                className="md:col-span-2 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <InfoTip label="Outcome Names" tip="Comma‑separated list. Count must match the number of outcomes." />
              </div>
              <input
                value={outcomeNames}
                onChange={(e) => setOutcomeNames(e.target.value)}
                placeholder="e.g., Yes,No (or A,B,C)"
                className="md:col-span-2 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>
          </>
        )}

        {/* Scalar fields */}
        {marketType === 'scalar' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div><InfoTip label="Min" tip="Lowest possible numeric value." /></div>
              <input
                value={scalarMin}
                onChange={(e) => setScalarMin(e.target.value)}
                className="md:col-span-2 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div><InfoTip label="Max" tip="Highest possible numeric value." /></div>
              <input
                value={scalarMax}
                onChange={(e) => setScalarMax(e.target.value)}
                className="md:col-span-2 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div><InfoTip label="Decimals" tip="How many decimals the scalar uses (e.g., 18)." /></div>
              <input
                type="number"
                min={0}
                value={scalarDecimals}
                onChange={(e) => setScalarDecimals(parseInt(e.target.value || '0', 10))}
                className="md:col-span-2 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>
          </>
        )}

        {/* Footer row: fee pill on left, button on right */}
        <div className="flex items-center justify-between pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-2 text-white bg-neutral-900/60 border border-white/10 rounded-full">
            <Image src="/wkas.png" alt="WKAS" width={18} height={18} className="rounded-full ring-1 ring-white/20" />
            <span className="font-semibold">100 WKAS</span>
            <span className="text-xs text-white/60">CREATION FEE</span>
          </div>
          <OutlineButton onClick={handleCreate} disabled={submitting}>
            <span className="font-cyber">{submitting ? 'Creating…' : 'Create Market'}</span>
          </OutlineButton>
        </div>
      </GlassCard>

      {/* Quick explainer (moved UNDER main card) */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-2">Market Types — quick guide</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="binary">
            <AccordionTrigger className="text-white/90">Binary (Yes / No)</AccordionTrigger>
            <AccordionContent className="text-sm text-white/70">
              Two outcomes: <strong>Yes</strong> or <strong>No</strong>. Buy the side you believe will win.
              On resolution, the winning side redeems its collateral; the losing side becomes worthless.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="categorical">
            <AccordionTrigger className="text-white/90">Categorical (Multiple choices)</AccordionTrigger>
            <AccordionContent className="text-sm text-white/70">
              Two or more discrete outcomes (e.g., A / B / C). You trade the specific outcome token you think will win.
              At resolution, only the winning outcome token redeems collateral.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="scalar">
            <AccordionTrigger className="text-white/90">Scalar (Numeric range)</AccordionTrigger>
            <AccordionContent className="text-sm text-white/70">
              The result is a number within a min–max range (e.g., price, temperature). Settlement is derived from the
              final reported value. Ensure you set realistic <em>min</em>, <em>max</em>, and <em>decimals</em>.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </GlassCard>
    </div>
  );
}
