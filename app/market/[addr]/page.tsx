"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import {
  BINARY_MARKET_ABI,
  CATEGORICAL_MARKET_ABI,
  SCALAR_MARKET_ABI,
  ERC20_ABI,
} from "@/lib/abis";
import GlassCard from "@/components/ui/glass-card";
import { OutlineButton } from "@/components/ui/gradient-outline";
import { useToast } from "@/hooks/use-toast";
import { decodeEventLog, parseUnits } from "viem";

/**
 * Dynamic market page.  Displays on‑chain information for a prediction
 * market and provides forms to interact with it.  Supports binary,
 * categorical and scalar markets by detecting the marketType on load.
 */
export default function MarketDetailPage() {
  const params = useParams<{ addr: string }>();
  const marketAddress = useMemo(() => (params?.addr as string)?.toLowerCase(), [params]);
  const { address: userAddress, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  // Determine market type by reading the `marketType` enum from MarketBase.
  const {
    data: marketType,
    isSuccess: typeLoaded,
  } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: "marketType",
    query: { enabled: !!marketAddress },
  });

  // Choose the appropriate ABI once the type is known.  We cast the type to
  // `number` for clarity; solidity enums start from 0 (binary), 1
  // (categorical), 2 (scalar).
  const selectedAbi = useMemo(() => {
    if (!typeLoaded || marketType === undefined) return undefined;
    const t = Number(marketType);
    if (t === 0) return BINARY_MARKET_ABI;
    if (t === 1) return CATEGORICAL_MARKET_ABI;
    if (t === 2) return SCALAR_MARKET_ABI;
    return undefined;
  }, [typeLoaded, marketType]);

  // Read common market metadata (collateral, oracle, questionId, status, fee)
  const { data: collateralAddr } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "collateral",
    query: { enabled: !!selectedAbi },
  });
  const { data: oracleAddr } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "oracle",
    query: { enabled: !!selectedAbi },
  });
  const { data: questionId } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "questionId",
    query: { enabled: !!selectedAbi },
  });
  const { data: status } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "status",
    query: { enabled: !!selectedAbi },
  });
  const { data: redeemFeeBps } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "redeemFeeBps",
    query: { enabled: !!selectedAbi },
  });
  const { data: collateralLocked } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "collateralLocked",
    query: { enabled: !!selectedAbi },
  });

  // Collateral token decimals for parsing amounts; default to 18 if unknown
  const { data: collateralDecimals } = useReadContract({
    address: (collateralAddr || undefined) as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!collateralAddr },
  });

  // Binary‑specific data
  const { data: yesToken } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "yesToken",
    query: { enabled: !!selectedAbi && Number(marketType) === 0 },
  });
  const { data: noToken } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "noToken",
    query: { enabled: !!selectedAbi && Number(marketType) === 0 },
  });
  const { data: outcomeYes } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "outcomeYes",
    query: { enabled: !!selectedAbi && Number(marketType) === 0 },
  });

  // Categorical‑specific data
  const { data: outcomeCount } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "outcomeCount",
    query: { enabled: !!selectedAbi && Number(marketType) === 1 },
  });
  const { data: winner } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "winner",
    query: { enabled: !!selectedAbi && Number(marketType) === 1 },
  });

  // Scalar‑specific data
  const { data: scalarMin } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "scalarMin",
    query: { enabled: !!selectedAbi && Number(marketType) === 2 },
  });
  const { data: scalarMax } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "scalarMax",
    query: { enabled: !!selectedAbi && Number(marketType) === 2 },
  });
  const { data: scalarDecimalsVal } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "scalarDecimals",
    query: { enabled: !!selectedAbi && Number(marketType) === 2 },
  });
  const { data: resolvedValue } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "resolvedValue",
    query: { enabled: !!selectedAbi && Number(marketType) === 2 },
  });
  const { data: longToken } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "longToken",
    query: { enabled: !!selectedAbi && Number(marketType) === 2 },
  });
  const { data: shortToken } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: selectedAbi || [],
    functionName: "shortToken",
    query: { enabled: !!selectedAbi && Number(marketType) === 2 },
  });

  // Inputs for user actions
  const [splitAmount, setSplitAmount] = useState('');
  const [mergeAmount, setMergeAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemLongAmount, setRedeemLongAmount] = useState('');
  const [redeemShortAmount, setRedeemShortAmount] = useState('');

  // Helper to parse a user input (string) into wei based on decimals.  If
  // decimals are undefined, assume 18.
  const parseToUnits = (value: string): bigint => {
    try {
      const dec = collateralDecimals !== undefined ? Number(collateralDecimals) : 18;
      return parseUnits(value || '0', dec);
    } catch (err) {
      // fallback: treat as integer wei
      return BigInt(value || '0');
    }
  };

  // Generic write helper: approve collateral then call the market function.  For
  // split/merge the user must approve the market to spend their collateral.
  async function approveAndCall(fnName: string, amountStr: string) {
    if (!isConnected) {
      toast({ title: 'Not connected', description: 'Please connect your wallet.' });
      return;
    }
    if (!collateralAddr) {
      toast({ title: 'Missing collateral', description: 'Unable to read collateral token.' });
      return;
    }
    const amount = parseToUnits(amountStr);
    if (amount <= 0n) {
      toast({ title: 'Invalid amount', description: 'Please enter a positive amount.' });
      return;
    }
    try {
      // approve
      toast({ title: 'Approving', description: 'Sending approval transaction...' });
      const approveTx = await writeContractAsync({
        address: collateralAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [marketAddress as `0x${string}`, amount],
      });
      await writeWait(approveTx);
      toast({ title: 'Approved', description: 'Collateral approved.' });
    } catch (err: any) {
      toast({ title: 'Approval failed', description: err?.shortMessage || err?.message || 'Failed to approve collateral.' });
      return;
    }
    try {
      toast({ title: 'Submitting', description: `Calling ${fnName}...` });
      const tx = await writeContractAsync({
        address: marketAddress as `0x${string}`,
        abi: selectedAbi as any,
        functionName: fnName as any,
        args: [amount],
      });
      await writeWait(tx);
      toast({ title: 'Transaction sent', description: `${fnName} executed successfully.` });
    } catch (err: any) {
      toast({ title: 'Transaction failed', description: err?.shortMessage || err?.message || `Failed to call ${fnName}.` });
    }
  }

  // Wait helper that leverages wagmi publicClient via config imported in wagmi.ts
  async function writeWait(txHash: `0x${string}`) {
    // The wagmi config exports a publicClient which we can import lazily to
    // wait for transaction receipts.  Importing inside a helper avoids
    // circular dependencies at module load time.
    const { config } = await import('@/lib/wagmi');
    await config.publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  // Action handlers
  const handleSplit = async () => {
    await approveAndCall('split', splitAmount);
    setSplitAmount('');
  };
  const handleMerge = async () => {
    await approveAndCall('merge', mergeAmount);
    setMergeAmount('');
  };
  const handleFinalize = async () => {
    if (!isConnected) {
      toast({ title: 'Not connected', description: 'Please connect your wallet.' });
      return;
    }
    try {
      toast({ title: 'Finalizing', description: 'Sending finalize transaction...' });
      const tx = await writeContractAsync({
        address: marketAddress as `0x${string}`,
        abi: selectedAbi as any,
        functionName: 'finalizeFromOracle',
        args: [],
      });
      await writeWait(tx);
      toast({ title: 'Finalized', description: 'Market finalized from oracle.' });
    } catch (err: any) {
      toast({ title: 'Finalize failed', description: err?.shortMessage || err?.message || 'Failed to finalize.' });
    }
  };
  const handleRedeem = async () => {
    await approveAndCall('redeem', redeemAmount);
    setRedeemAmount('');
  };
  const handleRedeemLong = async () => {
    await approveAndCall('redeemLong', redeemLongAmount);
    setRedeemLongAmount('');
  };
  const handleRedeemShort = async () => {
    await approveAndCall('redeemShort', redeemShortAmount);
    setRedeemShortAmount('');
  };

  // Helper to display status
  const statusLabel = useMemo(() => {
    const s = Number(status);
    if (s === 0) return 'Open';
    if (s === 1) return 'Resolved';
    if (s === 2) return 'Cancelled';
    return 'Unknown';
  }, [status]);

  // Format bigints to strings with decimals; if decimals unknown assume 18
  const formatAmount = (val?: any): string => {
    if (val === undefined) return '';
    try {
      const dec = collateralDecimals !== undefined ? Number(collateralDecimals) : 18;
      const s = (BigInt(val).toString());
      // convert to decimal string by dividing by 10^dec
      const pow = 10n ** BigInt(dec);
      const whole = BigInt(val) / pow;
      const fraction = BigInt(val) % pow;
      const fractionStr = fraction.toString().padStart(dec, '0').replace(/0+$/, '');
      return fractionStr.length > 0 ? `${whole}.${fractionStr}` : whole.toString();
    } catch {
      return val.toString();
    }
  };

  if (!marketAddress) {
    return <div className="p-6">Invalid market address.</div>;
  }
  if (!selectedAbi) {
    return <div className="p-6">Loading market...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
          Market Details
        </h1>
        <p className="text-gray-400 text-lg break-all">{marketAddress}</p>
      </div>
      <GlassCard>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <span className="w-40 font-medium">Status</span>
            <span className="flex-1 text-white">{statusLabel}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <span className="w-40 font-medium">Redeem Fee</span>
            <span className="flex-1 text-white">{redeemFeeBps ? `${redeemFeeBps.toString()} bps` : '…'}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <span className="w-40 font-medium">Collateral Locked</span>
            <span className="flex-1 text-white">{formatAmount(collateralLocked)} {collateralAddr?.slice(0, 6)}…</span>
          </div>
          {marketType !== undefined && Number(marketType) === 0 && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">YES Token</span>
                <span className="flex-1 text-white break-all">{yesToken as string}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">NO Token</span>
                <span className="flex-1 text-white break-all">{noToken as string}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">Outcome</span>
                <span className="flex-1 text-white">{statusLabel !== 'Resolved' ? '—' : outcomeYes ? 'YES' : 'NO'}</span>
              </div>
            </>
          )}
          {marketType !== undefined && Number(marketType) === 1 && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">Outcomes</span>
                <span className="flex-1 text-white">{outcomeCount?.toString() || '…'}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">Winner</span>
                <span className="flex-1 text-white">{statusLabel !== 'Resolved' ? '—' : winner?.toString()}</span>
              </div>
            </>
          )}
          {marketType !== undefined && Number(marketType) === 2 && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">Range</span>
                <span className="flex-1 text-white">{scalarMin?.toString()} — {scalarMax?.toString()}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">Decimals</span>
                <span className="flex-1 text-white">{scalarDecimalsVal?.toString()}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">Resolved</span>
                <span className="flex-1 text-white">{statusLabel !== 'Resolved' ? '—' : resolvedValue?.toString()}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">LONG Token</span>
                <span className="flex-1 text-white break-all">{longToken as string}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="w-40 font-medium">SHORT Token</span>
                <span className="flex-1 text-white break-all">{shortToken as string}</span>
              </div>
            </>
          )}
        </div>
      </GlassCard>
      {/* Interaction card */}
      <GlassCard>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Interact</h2>
          {/* Split */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-32">Split</label>
            <input
              type="text"
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
              placeholder="Collateral amount"
              className="flex-1 bg-neutral-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
            <OutlineButton onClick={handleSplit} disabled={!isConnected || !selectedAbi}>Split</OutlineButton>
          </div>
          {/* Merge */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-32">Merge</label>
            <input
              type="text"
              value={mergeAmount}
              onChange={(e) => setMergeAmount(e.target.value)}
              placeholder="Sets to merge"
              className="flex-1 bg-neutral-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
            <OutlineButton onClick={handleMerge} disabled={!isConnected || !selectedAbi}>Merge</OutlineButton>
          </div>
          {/* Finalize */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-32">Finalize</label>
            <div className="flex-1" />
            <OutlineButton onClick={handleFinalize} disabled={!isConnected || !selectedAbi}>Finalize</OutlineButton>
          </div>
          {/* Redeem */}
          {marketType !== undefined && Number(marketType) === 0 && (
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="w-32">Redeem</label>
              <input
                type="text"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="Winning tokens"
                className="flex-1 bg-neutral-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
              <OutlineButton onClick={handleRedeem} disabled={!isConnected || !selectedAbi}>Redeem</OutlineButton>
            </div>
          )}
          {marketType !== undefined && Number(marketType) === 1 && (
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="w-32">Redeem</label>
              <input
                type="text"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="Winner tokens"
                className="flex-1 bg-neutral-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
              <OutlineButton onClick={handleRedeem} disabled={!isConnected || !selectedAbi}>Redeem</OutlineButton>
            </div>
          )}
          {marketType !== undefined && Number(marketType) === 2 && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="w-32">Redeem LONG</label>
                <input
                  type="text"
                  value={redeemLongAmount}
                  onChange={(e) => setRedeemLongAmount(e.target.value)}
                  placeholder="Long tokens"
                  className="flex-1 bg-neutral-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <OutlineButton onClick={handleRedeemLong} disabled={!isConnected || !selectedAbi}>Redeem Long</OutlineButton>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="w-32">Redeem SHORT</label>
                <input
                  type="text"
                  value={redeemShortAmount}
                  onChange={(e) => setRedeemShortAmount(e.target.value)}
                  placeholder="Short tokens"
                  className="flex-1 bg-neutral-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <OutlineButton onClick={handleRedeemShort} disabled={!isConnected || !selectedAbi}>Redeem Short</OutlineButton>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}