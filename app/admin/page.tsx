"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/glass-card";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Plus,
  Ban,
  Gavel,
  Settings,
} from "lucide-react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { FACTORIES, DEFAULT_ORACLE, DEFAULT_COLLATERAL } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/lib/wagmi";
import {
  decodeEventLog,
  keccak256,
  toHex,
  encodeAbiParameters,
  parseAbi,
  type Hex,
} from "viem";

/** Hard-gated DAO address ONLY */
const DAO_ADDRESS = "0xD031272E734F2B38515F2F55F2F935d3227b739d".toLowerCase();

/** Minimal ABIs used here.  Important: name tuple fields in createQuestion. */
const ORACLE_ABI = parseAbi([
  "event QuestionCreated(bytes32 indexed id, (uint8 qtype, uint32 options, int256 scalarMin, int256 scalarMax, uint32 scalarDecimals, uint32 timeout, uint8 bondMultiplier, uint8 maxRounds, bytes32 templateHash, string dataSource, address consumer, uint64 openingTs) params)",
  "function createQuestion((uint8 qtype,uint32 options,int256 scalarMin,int256 scalarMax,uint32 scalarDecimals,uint32 timeout,uint8 bondMultiplier,uint8 maxRounds,bytes32 templateHash,string dataSource,address consumer,uint64 openingTs),bytes32 salt) external returns (bytes32)",
  "function finalize(bytes32 id) external",
  "function setQuestionFee(uint256) external",
  "function questionFee() view returns (uint256)",
  "function bondToken() view returns (address)",
  "function setFeeBps(uint256) external",
  "function feeBps() view returns (uint256)",
  "function setFeeSink(address) external",
  "function feeSink() view returns (address)",
  "function setArbitrator(address) external",
  "function arbitrator() view returns (address)",
  "function setMinBaseBond(uint256) external",
  "function minBaseBond() view returns (uint256)",
  "function setEscalationBond(uint256) external",
  "function escalationBond() view returns (uint256)",
  "function setPaused(bool) external",
  "function paused() view returns (bool)",
]);

const BINARY_FACTORY_ABI = parseAbi([
  "function submitBinary(address collateral, address oracle, bytes32 questionId, string marketName) external returns (address)",
  "function removeListing(address market, string reason) external",
  "function restoreListing(address market) external",
  "function setDefaultRedeemFeeBps(uint256) external",
  "function marketCount() view returns (uint256)",
  "function defaultRedeemFeeBps() view returns (uint256)"
]);

const CATEGORICAL_FACTORY_ABI = parseAbi([
  "function submitCategorical(address collateral, address oracle, bytes32 questionId, string marketName, uint8 numOutcomes, string[] outcomeNames) external returns (address)",
  "function removeListing(address market, string reason) external",
  "function restoreListing(address market) external",
  "function setDefaultRedeemFeeBps(uint256) external",
  "function marketCount() view returns (uint256)",
  "function defaultRedeemFeeBps() view returns (uint256)"
]);

const SCALAR_FACTORY_ABI = parseAbi([
  "function submitScalar(address collateral, address oracle, bytes32 questionId, string marketName, int256 min, int256 max, uint32 decimals) external returns (address)",
  "function removeListing(address market, string reason) external",
  "function restoreListing(address market) external",
  "function setDefaultRedeemFeeBps(uint256) external",
  "function marketCount() view returns (uint256)",
  "function defaultRedeemFeeBps() view returns (uint256)"
]);

const MARKET_BASE_ABI = parseAbi([
  "function finalizeFromOracle() external"
]);

const SIMPLE_ARBITRATOR_ABI = parseAbi([
  "function adminRule(bytes32 questionId, bytes encodedOutcome, address payee) external"
]);

/** Utils */
const normalizeHash = (h: any): Hex => (typeof h === "string" ? h : (h?.hash as Hex));
const isHex32 = (v: string) => /^0x[0-9a-fA-F]{64}$/.test(v?.trim() || "");

type TabId =
  | "overview"
  | "create"
  | "moderate"
  | "oracle"
  | "factories"
  | "resolution"
  | "arbitration";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const [selectedTab, setSelectedTab] = useState<TabId>("overview");

  // ---- Admin gate: STRICT to DAO_ADDRESS ----
  const userIsAdmin =
    isConnected && !!address && address.toLowerCase() === DAO_ADDRESS;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center p-6">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access admin panel</p>
        </GlassCard>
      </div>
    );
  }

  if (!userIsAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center p-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have admin privileges</p>
          <p className="text-xs text-gray-500 mt-2">Connected: {address}</p>
        </GlassCard>
      </div>
    );
  }

  // ---- Chain ensure helper ----
  const ensureChain = async () => {
    const requiredChainId = (config.chains?.[0]?.id as number | undefined) || chainId;
    if (chainId !== requiredChainId) {
      await switchChainAsync({ chainId: requiredChainId });
    }
  };

  // ##############################################
  //  TAB: Admin Create Market (owner path: no fee)
  // ##############################################
  const [marketType, setMarketType] = useState<"binary" | "categorical" | "scalar">("binary");
  const [marketName, setMarketName] = useState<string>("");
  const [numOutcomes, setNumOutcomes] = useState<number>(3);
  const [outcomeNames, setOutcomeNames] = useState<string>("A,B,C");
  const [scalarMin, setScalarMin] = useState<string>("0");
  const [scalarMax, setScalarMax] = useState<string>("100");
  const [scalarDecimals, setScalarDecimals] = useState<number>(2);
  const [creating, setCreating] = useState<boolean>(false);
  const [lastQuestionId, setLastQuestionId] = useState<string>("");
  const [lastMarketAddress, setLastMarketAddress] = useState<string>("");

  const selectedFactory: Hex | undefined = useMemo(() => {
    if (marketType === "binary") return FACTORIES.binary as Hex;
    if (marketType === "categorical") return FACTORIES.categorical as Hex;
    return FACTORIES.scalar as Hex;
  }, [marketType]);

  const handleAdminCreate = async () => {
    if (creating) return;
    setCreating(true);
    setLastQuestionId("");
    setLastMarketAddress("");

    try {
      await ensureChain();
      if (!DEFAULT_ORACLE || !DEFAULT_COLLATERAL || !selectedFactory) {
        toast({
          title: "Missing config",
          description: "Check DEFAULT_ORACLE / DEFAULT_COLLATERAL / factory addresses.",
        });
        return;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const template = marketName || "Untitled";
      const templateHash = keccak256(toHex(template));
      const timeout = 24 * 60 * 60; // seconds
      const bondMultiplier = 2;
      const maxRounds = 5;
      const openingTs = BigInt(nowSec + 60 * 60);

      const base = {
        timeout,
        bondMultiplier,
        maxRounds,
        templateHash,
        dataSource: "WKAS",
        consumer: "0x0000000000000000000000000000000000000000",
        openingTs,
      };

      // Use BigInt for int256 fields; for binary/categorical pass 0n
      const params =
        marketType === "binary"
          ? {
              qtype: 0,
              options: 2,
              scalarMin: 0n,
              scalarMax: 0n,
              scalarDecimals: 0,
              ...base,
            }
          : marketType === "categorical"
          ? {
              qtype: 1,
              options: Number(numOutcomes),
              scalarMin: 0n,
              scalarMax: 0n,
              scalarDecimals: 0,
              ...base,
            }
          : {
              qtype: 2,
              options: 0,
              scalarMin: BigInt(scalarMin || "0"),
              scalarMax: BigInt(scalarMax || "0"),
              scalarDecimals: Number(scalarDecimals || 0),
              ...base,
            };

      const salt = keccak256(toHex(String(Date.now()) + address));

      // 1) Owner path: createQuestion (no fee). Named tuple means object works.
      const qHashLike = await writeContractAsync({
        address: DEFAULT_ORACLE as Hex,
        abi: ORACLE_ABI,
        functionName: "createQuestion",
        args: [params as any, salt],
      });
      const qHash = normalizeHash(qHashLike);
      const qReceipt = await waitForTransactionReceipt(config, { hash: qHash });

      // Parse QuestionCreated(id)
      let questionId: Hex | undefined = undefined;
      for (const log of qReceipt.logs) {
        try {
          const parsed = decodeEventLog({
            abi: ORACLE_ABI,
            data: log.data as Hex,
            topics: log.topics as readonly Hex[],
          }) as any;
          if (parsed?.eventName === "QuestionCreated") {
            questionId = parsed.args?.id as Hex;
            break;
          }
        } catch {}
      }
      if (!questionId) {
        toast({ title: "Oracle error", description: "Could not obtain questionId from events." });
        return;
      }
      setLastQuestionId(questionId);

      // 2) Submit via factory
      let submitTx: Hex | undefined;
      if (marketType === "binary") {
        const txLike = await writeContractAsync({
          address: selectedFactory,
          abi: BINARY_FACTORY_ABI,
          functionName: "submitBinary",
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, template],
        });
        submitTx = normalizeHash(txLike);
      } else if (marketType === "categorical") {
        const count = Number(numOutcomes);
        const namesArray = outcomeNames.split(",").map((s) => s.trim()).filter(Boolean);
        if (namesArray.length !== count) {
          toast({
            title: "Input mismatch",
            description: "Outcome names must match the number of outcomes.",
          });
          return;
        }
        const txLike = await writeContractAsync({
          address: selectedFactory,
          abi: CATEGORICAL_FACTORY_ABI,
          functionName: "submitCategorical",
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, template, count, namesArray],
        });
        submitTx = normalizeHash(txLike);
      } else {
        const txLike = await writeContractAsync({
          address: selectedFactory,
          abi: SCALAR_FACTORY_ABI,
          functionName: "submitScalar",
          args: [
            DEFAULT_COLLATERAL as Hex,
            DEFAULT_ORACLE as Hex,
            questionId,
            template,
            BigInt(scalarMin || "0"),
            BigInt(scalarMax || "0"),
            Number(scalarDecimals || 0),
          ],
        });
        submitTx = normalizeHash(txLike);
      }

      await waitForTransactionReceipt(config, { hash: submitTx! });
      toast({ title: "Admin Market Created", description: "Question + market deployed successfully." });
      setLastMarketAddress("(see explorer / factory events)");
    } catch (err: any) {
      toast({ title: "Create failed", description: err?.shortMessage || err?.message || "Unknown error" });
    } finally {
      setCreating(false);
    }
  };

  // ########################
  //  TAB: Moderation (factories)
  // ########################
  const [modMarket, setModMarket] = useState<string>("");
  const [modReason, setModReason] = useState<string>("");
  const [modBusy, setModBusy] = useState<boolean>(false);

  async function tryMultiWrite(
    calls: Array<{ address: Hex; abi: any; functionName: string; args: any[] }>
  ) {
    for (const c of calls) {
      try {
        const txLike = await writeContractAsync({
          address: c.address,
          abi: c.abi,
          functionName: c.functionName as any,
          args: c.args,
        });
        return normalizeHash(txLike);
      } catch {}
    }
    throw new Error("No compatible function on provided contracts.");
  }

  const handleRemoveListing = async () => {
    if (modBusy) return;
    setModBusy(true);
    try {
      await ensureChain();
      if (!modMarket) throw new Error("Market address required");
      if (!FACTORIES?.binary && !FACTORIES?.categorical && !FACTORIES?.scalar)
        throw new Error("Factory addresses missing");

      const calls = [
        FACTORIES?.binary && {
          address: FACTORIES.binary as Hex,
          abi: BINARY_FACTORY_ABI,
          functionName: "removeListing",
          args: [modMarket as Hex, modReason || "Removed by admin"],
        },
        FACTORIES?.categorical && {
          address: FACTORIES.categorical as Hex,
          abi: CATEGORICAL_FACTORY_ABI,
          functionName: "removeListing",
          args: [modMarket as Hex, modReason || "Removed by admin"],
        },
        FACTORIES?.scalar && {
          address: FACTORIES.scalar as Hex,
          abi: SCALAR_FACTORY_ABI,
          functionName: "removeListing",
          args: [modMarket as Hex, modReason || "Removed by admin"],
        },
      ].filter(Boolean) as Array<{ address: Hex; abi: any; functionName: string; args: any[] }>;

      const tx = await tryMultiWrite(calls);
      await waitForTransactionReceipt(config, { hash: tx });
      toast({ title: "Listing removed", description: "Market has been unlisted." });
    } catch (err: any) {
      toast({ title: "Remove failed", description: err?.shortMessage || err?.message || "Unknown error" });
    } finally {
      setModBusy(false);
    }
  };

  const handleRestoreListing = async () => {
    if (modBusy) return;
    setModBusy(true);
    try {
      await ensureChain();
      if (!modMarket) throw new Error("Market address required");

      const calls = [
        FACTORIES?.binary && {
          address: FACTORIES.binary as Hex,
          abi: BINARY_FACTORY_ABI,
          functionName: "restoreListing",
          args: [modMarket as Hex],
        },
        FACTORIES?.categorical && {
          address: FACTORIES.categorical as Hex,
          abi: CATEGORICAL_FACTORY_ABI,
          functionName: "restoreListing",
          args: [modMarket as Hex],
        },
        FACTORIES?.scalar && {
          address: FACTORIES.scalar as Hex,
          abi: SCALAR_FACTORY_ABI,
          functionName: "restoreListing",
          args: [modMarket as Hex],
        },
      ].filter(Boolean) as Array<{ address: Hex; abi: any; functionName: string; args: any[] }>;

      const tx = await tryMultiWrite(calls);
      await waitForTransactionReceipt(config, { hash: tx });
      toast({ title: "Listing restored", description: "Market is visible again." });
    } catch (err: any) {
      toast({ title: "Restore failed", description: err?.shortMessage || err?.message || "Unknown error" });
    } finally {
      setModBusy(false);
    }
  };

  // ########################
  //  TAB: Oracle Controls
  // ########################
  const [oracleReads, setOracleReads] = useState<any>(null);

  const refreshOracle = async () => {
    if (!DEFAULT_ORACLE) return;
    try {
      const [questionFee, feeBps, feeSink, arbitrator, minBaseBond, escalationBond, paused, bondToken] =
        await Promise.all([
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "questionFee", args: [] }) as Promise<bigint>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "feeBps", args: [] }) as Promise<number>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "feeSink", args: [] }) as Promise<Hex>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "arbitrator", args: [] }) as Promise<Hex>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "minBaseBond", args: [] }) as Promise<bigint>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "escalationBond", args: [] }) as Promise<bigint>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "paused", args: [] }) as Promise<boolean>,
          readContract(config, { address: DEFAULT_ORACLE as Hex, abi: ORACLE_ABI, functionName: "bondToken", args: [] }) as Promise<Hex>,
        ]);
      setOracleReads({
        questionFee: questionFee.toString(),
        feeBps: Number(feeBps),
        feeSink,
        arbitrator,
        minBaseBond: minBaseBond.toString(),
        escalationBond: escalationBond.toString(),
        paused,
        bondToken,
      });
    } catch (e) {
      setOracleReads(null);
    }
  };

  useEffect(() => {
    refreshOracle();
  }, [address]);

  const [newQuestionFee, setNewQuestionFee] = useState<string>("");
  const [newFeeBps, setNewFeeBps] = useState<string>("");
  const [newFeeSink, setNewFeeSink] = useState<string>("");
  const [newArbitrator, setNewArbitrator] = useState<string>("");
  const [newMinBaseBond, setNewMinBaseBond] = useState<string>("");
  const [newEscalationBond, setNewEscalationBond] = useState<string>("");
  const [newPaused, setNewPaused] = useState<boolean | null>(null);

  const writeOracle = async (fn: string, args: any[]) => {
    await ensureChain();
    const txLike = await writeContractAsync({
      address: DEFAULT_ORACLE as Hex,
      abi: ORACLE_ABI,
      functionName: fn as any,
      args,
    });
    const tx = normalizeHash(txLike);
    await waitForTransactionReceipt(config, { hash: tx });
    await refreshOracle();
  };

  // ########################
  //  TAB: Factories
  // ########################
  const [factoryReads, setFactoryReads] = useState<any>(null);
  const refreshFactories = async () => {
    try {
      const res: any = {};
      if (FACTORIES?.binary) {
        const [cnt, fee] = await Promise.all([
          readContract(config, { address: FACTORIES.binary as Hex, abi: BINARY_FACTORY_ABI, functionName: "marketCount", args: [] }) as Promise<bigint>,
          readContract(config, { address: FACTORIES.binary as Hex, abi: BINARY_FACTORY_ABI, functionName: "defaultRedeemFeeBps", args: [] }) as Promise<number>,
        ]);
        res.binary = { count: Number(cnt), redeemFeeBps: Number(fee) };
      }
      if (FACTORIES?.categorical) {
        const [cnt, fee] = await Promise.all([
          readContract(config, { address: FACTORIES.categorical as Hex, abi: CATEGORICAL_FACTORY_ABI, functionName: "marketCount", args: [] }) as Promise<bigint>,
          readContract(config, { address: FACTORIES.categorical as Hex, abi: CATEGORICAL_FACTORY_ABI, functionName: "defaultRedeemFeeBps", args: [] }) as Promise<number>,
        ]);
        res.categorical = { count: Number(cnt), redeemFeeBps: Number(fee) };
      }
      if (FACTORIES?.scalar) {
        const [cnt, fee] = await Promise.all([
          readContract(config, { address: FACTORIES.scalar as Hex, abi: SCALAR_FACTORY_ABI, functionName: "marketCount", args: [] }) as Promise<bigint>,
          readContract(config, { address: FACTORIES.scalar as Hex, abi: SCALAR_FACTORY_ABI, functionName: "defaultRedeemFeeBps", args: [] }) as Promise<number>,
        ]);
        res.scalar = { count: Number(cnt), redeemFeeBps: Number(fee) };
      }
      setFactoryReads(res);
    } catch (e) {
      setFactoryReads(null);
    }
  };
  useEffect(() => {
    refreshFactories();
  }, [address]);

  const [binaryRedeemFee, setBinaryRedeemFee] = useState<string>("");
  const [categoricalRedeemFee, setCategoricalRedeemFee] = useState<string>("");
  const [scalarRedeemFee, setScalarRedeemFee] = useState<string>("");

  const setFactoryFee = async (which: "binary" | "categorical" | "scalar") => {
    await ensureChain();
    const addr = (FACTORIES as any)[which] as Hex;
    const abi = which === "binary" ? BINARY_FACTORY_ABI : which === "categorical" ? CATEGORICAL_FACTORY_ABI : SCALAR_FACTORY_ABI;
    const value =
      which === "binary"
        ? Number(binaryRedeemFee || 0)
        : which === "categorical"
        ? Number(categoricalRedeemFee || 0)
        : Number(scalarRedeemFee || 0);
    const txLike = await writeContractAsync({
      address: addr,
      abi,
      functionName: "setDefaultRedeemFeeBps",
      args: [value],
    });
    const tx = normalizeHash(txLike);
    await waitForTransactionReceipt(config, { hash: tx });
    await refreshFactories();
  };

  // ########################
  //  TAB: Resolution
  // ########################
  const [finalizeQuestionId, setFinalizeQuestionId] = useState<string>("");
  const [finalizeMarketAddr, setFinalizeMarketAddr] = useState<string>("");
  const [resBusy, setResBusy] = useState<boolean>(false);

  const doFinalizeQuestion = async () => {
    if (resBusy) return;
    setResBusy(true);
    try {
      await ensureChain();
      if (!isHex32(finalizeQuestionId)) throw new Error("Invalid questionId (bytes32 hex)");
      const txLike = await writeContractAsync({
        address: DEFAULT_ORACLE as Hex,
        abi: ORACLE_ABI,
        functionName: "finalize",
        args: [finalizeQuestionId as Hex],
      });
      const tx = normalizeHash(txLike);
      await waitForTransactionReceipt(config, { hash: tx });
      toast({ title: "Question finalized", description: "Oracle question finalized." });
    } catch (err: any) {
      toast({ title: "Finalize failed", description: err?.shortMessage || err?.message || "Unknown error" });
    } finally {
      setResBusy(false);
    }
  };

  const doFinalizeMarket = async () => {
    if (resBusy) return;
    setResBusy(true);
    try {
      await ensureChain();
      if (!finalizeMarketAddr) throw new Error("Market address required");
      const txLike = await writeContractAsync({
        address: finalizeMarketAddr as Hex,
        abi: MARKET_BASE_ABI,
        functionName: "finalizeFromOracle",
        args: [],
      });
      const tx = normalizeHash(txLike);
      await waitForTransactionReceipt(config, { hash: tx });
      toast({ title: "Market finalized", description: "Market pulled oracle result." });
    } catch (err: any) {
      toast({ title: "Finalize failed", description: err?.shortMessage || err?.message || "Unknown error" });
    } finally {
      setResBusy(false);
    }
  };

  // ########################
  //  TAB: Arbitration (optional)
  // ########################
  const [arbAddr, setArbAddr] = useState<string>("");
  const [arbQuestionId, setArbQuestionId] = useState<string>("");
  const [arbType, setArbType] = useState<"binary" | "categorical" | "scalar">("binary");
  const [arbBinaryValue, setArbBinaryValue] = useState<"yes" | "no">("yes");
  const [arbCategoricalIndex, setArbCategoricalIndex] = useState<number>(0);
  const [arbScalarValue, setArbScalarValue] = useState<string>("0");
  const [arbPayee, setArbPayee] = useState<string>("");
  const [arbBusy, setArbBusy] = useState<boolean>(false);

  const doAdminRule = async () => {
    if (arbBusy) return;
    setArbBusy(true);
    try {
      await ensureChain();
      if (!arbAddr) throw new Error("Arbitrator address required");
      if (!isHex32(arbQuestionId)) throw new Error("Invalid questionId (bytes32)");

      let encoded: Hex;
      if (arbType === "binary") {
        const val = arbBinaryValue === "yes";
        encoded = encodeAbiParameters([{ type: "bool" }], [val]) as Hex;
      } else if (arbType === "categorical") {
        encoded = encodeAbiParameters([{ type: "uint256" }], [BigInt(arbCategoricalIndex)]) as Hex;
      } else {
        encoded = encodeAbiParameters([{ type: "int256" }], [BigInt(arbScalarValue || "0")]) as Hex;
      }

      const txLike = await writeContractAsync({
        address: arbAddr as Hex,
        abi: SIMPLE_ARBITRATOR_ABI,
        functionName: "adminRule",
        args: [arbQuestionId as Hex, encoded, (arbPayee || address) as Hex],
      });
      const tx = normalizeHash(txLike);
      await waitForTransactionReceipt(config, { hash: tx });
      toast({ title: "Arbitration executed", description: "Admin ruling submitted." });
    } catch (err: any) {
      toast({ title: "Arbitration failed", description: err?.shortMessage || err?.message || "Unknown error" });
    } finally {
      setArbBusy(false);
    }
  };

  // ########################
  //   UI RENDER
  // ########################
  const tabs: Array<{ id: TabId; label: string; icon?: any }> = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "create", label: "Admin Create", icon: Plus },
    { id: "moderate", label: "Moderate", icon: Ban },
    { id: "oracle", label: "Oracle", icon: Settings },
    { id: "factories", label: "Factories", icon: Gavel },
    { id: "resolution", label: "Resolution", icon: CheckCircle },
    { id: "arbitration", label: "Arbitration", icon: Gavel },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-[#49EACB]" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <p className="text-gray-400 text-lg">Manage markets and platform operations</p>
        <div className="text-xs text-gray-500">Admin: {address}</div>
      </motion.div>

      {/* Tabs */}
      <GlassCard>
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedTab === tab.id
                    ? "bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black"
                    : "text-gray-300 hover:text-white border border-gray-600"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {selectedTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Quick Actions</h3>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>• Use <b>Admin Create</b> to deploy markets without the public creation fee.</p>
                  <p>• Use <b>Moderate</b> to remove or restore user-created listings.</p>
                  <p>• Use <b>Oracle</b> to adjust fees, bonds, arbitrator, or pause the oracle.</p>
                  <p>• Use <b>Resolution</b> to finalize questions or markets that are stuck.</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Addresses</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Oracle: {String(DEFAULT_ORACLE)}</div>
                  <div>Collateral: {String(DEFAULT_COLLATERAL)}</div>
                  <div>Binary Factory: {String(FACTORIES?.binary || "-")}</div>
                  <div>Categorical Factory: {String(FACTORIES?.categorical || "-")}</div>
                  <div>Scalar Factory: {String(FACTORIES?.scalar || "-")}</div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Admin Create */}
        {selectedTab === "create" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Create New Market (Admin, no fee)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Market Type</label>
              <select
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={marketType}
                onChange={(e) => setMarketType(e.target.value as any)}
              >
                <option value="binary">Binary (Yes/No)</option>
                <option value="categorical">Categorical</option>
                <option value="scalar">Scalar</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Market Name</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                placeholder="e.g., Will BTC close above $90k on Dec 31?"
              />
            </div>

            {marketType === "categorical" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300"># of Outcomes</label>
                  <input
                    type="number"
                    min={2}
                    className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    value={numOutcomes}
                    onChange={(e) => setNumOutcomes(parseInt(e.target.value || "2", 10))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Outcome Names</label>
                  <input
                    className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    value={outcomeNames}
                    onChange={(e) => setOutcomeNames(e.target.value)}
                    placeholder="Yes,No OR A,B,C"
                  />
                </div>
              </>
            )}

            {marketType === "scalar" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Min</label>
                  <input
                    className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    value={scalarMin}
                    onChange={(e) => setScalarMin(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Max</label>
                  <input
                    className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    value={scalarMax}
                    onChange={(e) => setScalarMax(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Decimals</label>
                  <input
                    type="number"
                    min={0}
                    className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    value={scalarDecimals}
                    onChange={(e) => setScalarDecimals(parseInt(e.target.value || "0", 10))}
                  />
                </div>
              </>
            )}

            <button
              onClick={handleAdminCreate}
              disabled={creating}
              className="w-full py-3 bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {creating ? "Creating…" : "Create Market (Admin)"}
            </button>

            {(lastQuestionId || lastMarketAddress) && (
              <div className="text-xs text-gray-400 space-y-1">
                {lastQuestionId && <div>QuestionId: {lastQuestionId}</div>}
                {lastMarketAddress && <div>Market: {lastMarketAddress}</div>}
              </div>
            )}
          </div>
        )}

        {/* Moderate */}
        {selectedTab === "moderate" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Moderate Listings</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Market Address</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={modMarket}
                onChange={(e) => setModMarket(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Reason (optional)</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                placeholder="Explicit content / spam / duplicate…"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRemoveListing}
                disabled={modBusy}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Remove Listing
              </button>
              <button
                onClick={handleRestoreListing}
                disabled={modBusy}
                className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Restore Listing
              </button>
            </div>
          </div>
        )}

        {/* Oracle */}
        {selectedTab === "oracle" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Oracle Controls</h3>

            <button
              onClick={refreshOracle}
              className="px-3 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white"
            >
              Refresh
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <div className="p-4 space-y-3 text-sm text-gray-300">
                  <div><b>questionFee</b>: {oracleReads?.questionFee ?? "-"}</div>
                  <div><b>feeBps</b>: {oracleReads?.feeBps ?? "-"}</div>
                  <div><b>feeSink</b>: {oracleReads?.feeSink ?? "-"}</div>
                  <div><b>bondToken</b>: {oracleReads?.bondToken ?? "-"}</div>
                  <div><b>arbitrator</b>: {oracleReads?.arbitrator ?? "-"}</div>
                  <div><b>minBaseBond</b>: {oracleReads?.minBaseBond ?? "-"}</div>
                  <div><b>escalationBond</b>: {oracleReads?.escalationBond ?? "-"}</div>
                  <div><b>paused</b>: {String(oracleReads?.paused) ?? "-"}</div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set questionFee (uint)</label>
                    <input
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newQuestionFee}
                      onChange={(e) => setNewQuestionFee(e.target.value)}
                      placeholder="e.g., 100e18"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set feeBps (uint)</label>
                    <input
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newFeeBps}
                      onChange={(e) => setNewFeeBps(e.target.value)}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set feeSink (address)</label>
                    <input
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newFeeSink}
                      onChange={(e) => setNewFeeSink(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set arbitrator (address)</label>
                    <input
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newArbitrator}
                      onChange={(e) => setNewArbitrator(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set minBaseBond (uint)</label>
                    <input
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newMinBaseBond}
                      onChange={(e) => setNewMinBaseBond(e.target.value)}
                      placeholder="e.g., 1e18"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set escalationBond (uint)</label>
                    <input
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newEscalationBond}
                      onChange={(e) => setNewEscalationBond(e.target.value)}
                      placeholder="e.g., 10e18"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="text-sm text-gray-300">Set paused (bool)</label>
                    <select
                      className="bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      value={newPaused === null ? "" : String(newPaused)}
                      onChange={(e) =>
                        setNewPaused(e.target.value === "" ? null : e.target.value === "true")
                      }
                    >
                      <option value="">--</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await writeOracle("setQuestionFee", [BigInt(newQuestionFee || "0")]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "questionFee set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save questionFee
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await writeOracle("setFeeBps", [Number(newFeeBps || "0")]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "feeBps set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save feeBps
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await writeOracle("setFeeSink", [newFeeSink as Hex]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "feeSink set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save feeSink
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await writeOracle("setArbitrator", [newArbitrator as Hex]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "arbitrator set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save arbitrator
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await writeOracle("setMinBaseBond", [BigInt(newMinBaseBond || "0")]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "minBaseBond set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save minBaseBond
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await writeOracle("setEscalationBond", [BigInt(newEscalationBond || "0")]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "escalationBond set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save escalationBond
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (newPaused === null) throw new Error("Choose true/false");
                          await writeOracle("setPaused", [newPaused]);
                        } catch (e: any) {
                          return toast({ title: "Failed", description: e?.shortMessage || e?.message || "Error" });
                        }
                        toast({ title: "Updated", description: "paused set." });
                      }}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
                    >
                      Save paused
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Factories */}
        {selectedTab === "factories" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Factories</h3>
            <button
              onClick={refreshFactories}
              className="px-3 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white"
            >
              Refresh
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Binary */}
              <GlassCard>
                <div className="p-4 space-y-3">
                  <h4 className="text-white font-semibold">Binary</h4>
                  <div className="text-sm text-gray-300">Address: {String(FACTORIES?.binary || "-")}</div>
                  <div className="text-sm text-gray-300">Markets: {factoryReads?.binary?.count ?? "-"}</div>
                  <div className="text-sm text-gray-300">Redeem Fee (bps): {factoryReads?.binary?.redeemFeeBps ?? "-"}</div>
                  <div className="mt-2">
                    <input
                      className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="New redeem fee bps"
                      value={binaryRedeemFee}
                      onChange={(e) => setBinaryRedeemFee(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setFactoryFee("binary")}
                    className="mt-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 text-sm"
                  >
                    Save
                  </button>
                </div>
              </GlassCard>

              {/* Categorical */}
              <GlassCard>
                <div className="p-4 space-y-3">
                  <h4 className="text-white font-semibold">Categorical</h4>
                  <div className="text-sm text-gray-300">Address: {String(FACTORIES?.categorical || "-")}</div>
                  <div className="text-sm text-gray-300">Markets: {factoryReads?.categorical?.count ?? "-"}</div>
                  <div className="text-sm text-gray-300">Redeem Fee (bps): {factoryReads?.categorical?.redeemFeeBps ?? "-"}</div>
                  <div className="mt-2">
                    <input
                      className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="New redeem fee bps"
                      value={categoricalRedeemFee}
                      onChange={(e) => setCategoricalRedeemFee(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setFactoryFee("categorical")}
                    className="mt-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 text-sm"
                  >
                    Save
                  </button>
                </div>
              </GlassCard>

              {/* Scalar */}
              <GlassCard>
                <div className="p-4 space-y-3">
                  <h4 className="text-white font-semibold">Scalar</h4>
                  <div className="text-sm text-gray-300">Address: {String(FACTORIES?.scalar || "-")}</div>
                  <div className="text-sm text-gray-300">Markets: {factoryReads?.scalar?.count ?? "-"}</div>
                  <div className="text-sm text-gray-300">Redeem Fee (bps): {factoryReads?.scalar?.redeemFeeBps ?? "-"}</div>
                  <div className="mt-2">
                    <input
                      className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="New redeem fee bps"
                      value={scalarRedeemFee}
                      onChange={(e) => setScalarRedeemFee(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setFactoryFee("scalar")}
                    className="mt-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 text-sm"
                  >
                    Save
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Resolution */}
        {selectedTab === "resolution" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Resolution & Finalization</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Finalize Question (bytes32 id)</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={finalizeQuestionId}
                onChange={(e) => setFinalizeQuestionId(e.target.value)}
                placeholder="0x... 32 bytes"
              />
            </div>
            <button
              onClick={doFinalizeQuestion}
              disabled={resBusy}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
            >
              Finalize Question
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-4">
              <label className="text-sm text-gray-300">Finalize Market (address)</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={finalizeMarketAddr}
                onChange={(e) => setFinalizeMarketAddr(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <button
              onClick={doFinalizeMarket}
              disabled={resBusy}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15"
            >
              Finalize Market From Oracle
            </button>
          </div>
        )}

        {/* Arbitration */}
        {selectedTab === "arbitration" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Arbitration (Danger Zone)</h3>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
              Only use if the normal dispute flow failed. This submits an admin ruling on the arbitrator contract.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Arbitrator Address</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={arbAddr}
                onChange={(e) => setArbAddr(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">QuestionId (bytes32)</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={arbQuestionId}
                onChange={(e) => setArbQuestionId(e.target.value)}
                placeholder="0x... 32 bytes"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Outcome Type</label>
              <select
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={arbType}
                onChange={(e) => setArbType(e.target.value as any)}
              >
                <option value="binary">Binary</option>
                <option value="categorical">Categorical</option>
                <option value="scalar">Scalar</option>
              </select>
            </div>

            {arbType === "binary" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-300">Binary Outcome</label>
                <select
                  className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  value={arbBinaryValue}
                  onChange={(e) => setArbBinaryValue(e.target.value as any)}
                >
                  <option value="yes">YES</option>
                  <option value="no">NO</option>
                </select>
              </div>
            )}

            {arbType === "categorical" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-300">Winner Index (uint)</label>
                <input
                  type="number"
                  className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  value={arbCategoricalIndex}
                  onChange={(e) => setArbCategoricalIndex(parseInt(e.target.value || "0", 10))}
                />
              </div>
            )}

            {arbType === "scalar" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-300">Scalar Value (int)</label>
                <input
                  className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  value={arbScalarValue}
                  onChange={(e) => setArbScalarValue(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Payee (address)</label>
              <input
                className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white"
                value={arbPayee}
                onChange={(e) => setArbPayee(e.target.value)}
                placeholder="0x... (who receives fees if any)"
              />
            </div>

            <button
              onClick={doAdminRule}
              disabled={arbBusy}
              className="px-4 py-2 bg-red-500/20 text-red-200 border border-red-500/30 rounded-lg hover:bg-red-500/30"
            >
              Submit Admin Ruling
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
