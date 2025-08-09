"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { config } from "@/lib/wagmi";
import { FACTORIES, DEFAULT_COLLATERAL, DEFAULT_ORACLE, DEFAULT_QUESTION_ID } from "@/lib/contracts";
import {
  ERC20_ABI,
  FACTORY_BASE_ABI,
  BINARY_FACTORY_ABI,
  CATEGORICAL_FACTORY_ABI,
  SCALAR_FACTORY_ABI,
} from "@/lib/abis";
import { decodeEventLog } from "viem";
import GlassCard from "@/components/ui/glass-card";
import { OutlineButton, OutlineField } from "@/components/ui/gradient-outline";
import { useToast } from "@/hooks/use-toast";

/**
 * Page allowing any user to create a new prediction market.  Users must pay
 * the flat creation fee (100 bond tokens) by approving the factory to spend
 * their BOND_TOKEN, then calling the appropriate `submit*` function on the
 * factory.  The market address is parsed from the emitted event once the
 * transaction is mined.
 */
export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  // Form fields
  // The user can choose between binary, categorical or scalar markets.  When
  // 'scalar' is selected, additional fields for the numeric range and
  // decimals will appear.
  const [marketType, setMarketType] = useState<'binary' | 'categorical' | 'scalar'>('binary');
  const [marketName, setMarketName] = useState('');
  // Default parameters are pulled from environment variables via
  // DEFAULT_COLLATERAL, DEFAULT_ORACLE and DEFAULT_QUESTION_ID.  Users
  // creating a market do not need to supply these fields on the frontend.
  // Categorical specific
  const [numOutcomes, setNumOutcomes] = useState(3);
  const [outcomeNames, setOutcomeNames] = useState('');
  // Scalar specific
  const [scalarMin, setScalarMin] = useState('');
  const [scalarMax, setScalarMax] = useState('');
  const [scalarDecimals, setScalarDecimals] = useState('18');
  // Created market address
  const [createdMarket, setCreatedMarket] = useState<`0x${string}` | undefined>();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Determine the selected factory address from env; the key lookup is based on
  // the market type.  Categorical and scalar markets are optional so
  // undefined factories will be gracefully handled.
  const selectedFactory = FACTORIES[marketType];

  // Read creationFee and bondToken from the factory.  We only read the
  // immutable configuration here; these values do not change per user.
  const { data: creationFee } = useReadContract({
    address: selectedFactory,
    abi: FACTORY_BASE_ABI,
    functionName: 'creationFee',
    query: {
      enabled: !!selectedFactory,
    },
  });
  const { data: factoryBondToken } = useReadContract({
    address: selectedFactory,
    abi: FACTORY_BASE_ABI,
    functionName: 'bondToken',
    query: {
      enabled: !!selectedFactory,
    },
  });

  const { writeContractAsync } = useWriteContract();

  async function handleCreate() {
    if (!isConnected) {
      toast({ title: 'Connect Wallet', description: 'Please connect your wallet before creating a market.' });
      return;
    }
    if (!selectedFactory) {
      toast({ title: 'Factory not configured', description: 'Factory address missing in environment.' });
      return;
    }
    if (!creationFee || !factoryBondToken) {
      toast({ title: 'Loading...', description: 'Please wait for factory configuration to load.' });
      return;
    }
    // Check that defaults exist
    if (!DEFAULT_COLLATERAL || !DEFAULT_ORACLE || !DEFAULT_QUESTION_ID) {
      toast({ title: 'Missing defaults', description: 'Default collateral, oracle or questionId not configured. Please set NEXT_PUBLIC_DEFAULT_COLLATERAL, NEXT_PUBLIC_DEFAULT_ORACLE and NEXT_PUBLIC_DEFAULT_QUESTION_ID in your environment.' });
      return;
    }
    if (!marketName) {
      toast({ title: 'Missing name', description: 'Please provide a market name.' });
      return;
    }
    // Approve the creation fee on the bond token
    try {
      toast({ title: 'Approving fee', description: 'Sending approval transaction...' });
      const approveTx = await writeContractAsync({
        address: factoryBondToken as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [selectedFactory as `0x${string}`, creationFee as bigint],
      });
      setTxHash(approveTx as `0x${string}`);
      await config.publicClient.waitForTransactionReceipt({ hash: approveTx as `0x${string}` });
      toast({ title: 'Approval confirmed', description: 'Creation fee approved, creating market...' });
    } catch (err: any) {
      toast({ title: 'Approval failed', description: err?.shortMessage || err?.message || 'Failed to approve fee.' });
      return;
    }

    // Prepare arguments based on market type
    let submitHash: `0x${string}` | undefined;
    try {
      if (marketType === 'binary') {
        submitHash = await writeContractAsync({
          address: selectedFactory as `0x${string}`,
          abi: BINARY_FACTORY_ABI,
          functionName: 'submitBinary',
          args: [
            DEFAULT_COLLATERAL as `0x${string}`,
            DEFAULT_ORACLE as `0x${string}`,
            DEFAULT_QUESTION_ID as `0x${string}`,
            marketName,
          ],
        }) as `0x${string}`;
      } else if (marketType === 'categorical') {
        // categorical
        const count = Number(numOutcomes);
        const namesArray = outcomeNames
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
        if (namesArray.length !== count) {
          toast({ title: 'Outcomes mismatch', description: `Number of outcome names (${namesArray.length}) does not match outcome count (${count}).` });
          return;
        }
        submitHash = await writeContractAsync({
          address: selectedFactory as `0x${string}`,
          abi: CATEGORICAL_FACTORY_ABI,
          functionName: 'submitCategorical',
          args: [
            DEFAULT_COLLATERAL as `0x${string}`,
            DEFAULT_ORACLE as `0x${string}`,
            DEFAULT_QUESTION_ID as `0x${string}`,
            marketName,
            count,
            namesArray,
          ],
        }) as `0x${string}`;
      } else {
        // scalar
        if (!scalarMin || !scalarMax) {
          toast({ title: 'Missing fields', description: 'Please provide min and max values for scalar market.' });
          return;
        }
        const minInt = BigInt(scalarMin);
        const maxInt = BigInt(scalarMax);
        const dec = Number(scalarDecimals) || 0;
        submitHash = await writeContractAsync({
          address: selectedFactory as `0x${string}`,
          abi: SCALAR_FACTORY_ABI,
          functionName: 'submitScalar',
          args: [
            DEFAULT_COLLATERAL as `0x${string}`,
            DEFAULT_ORACLE as `0x${string}`,
            DEFAULT_QUESTION_ID as `0x${string}`,
            marketName,
            minInt,
            maxInt,
            dec,
          ],
        }) as `0x${string}`;
      }
      if (!submitHash) return;
      setTxHash(submitHash);
      // Wait for the transaction to mine
      const receipt = await config.publicClient.waitForTransactionReceipt({ hash: submitHash });
      // Decode the emitted event to discover the deployed market address
      let newMarket: `0x${string}` | undefined;
      let abi;
      let eventName;
      if (marketType === 'binary') {
        abi = BINARY_FACTORY_ABI;
        eventName = 'BinaryCreated';
      } else if (marketType === 'categorical') {
        abi = CATEGORICAL_FACTORY_ABI;
        eventName = 'CategoricalCreated';
      } else {
        abi = SCALAR_FACTORY_ABI;
        eventName = 'ScalarCreated';
      }
      for (const log of receipt.logs) {
        try {
          const parsed = decodeEventLog({ abi, data: log.data as `0x${string}`, topics: log.topics as readonly `0x${string}`[] });
          if (parsed?.eventName === eventName) {
            // @ts-ignore
            newMarket = parsed.args.market as `0x${string}`;
            break;
          }
        } catch (_err) {
          // ignore decoding errors from unrelated logs
        }
      }
      if (newMarket) {
        setCreatedMarket(newMarket);
        toast({ title: 'Market created', description: `Deployed at ${newMarket}` });
      } else {
        toast({ title: 'Market created', description: 'Transaction confirmed. Unable to parse market address; please check explorer.' });
      }
    } catch (err: any) {
      toast({ title: 'Creation failed', description: err?.shortMessage || err?.message || 'Market creation failed.' });
    }
  }

  // Display the human‑readable creation fee; assume 18 decimals when decimals are unknown
  const creationFeeFormatted = creationFee ? (Number(creationFee) / 1e18).toString() : '...';

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to create a market.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
          Create Prediction Market
        </h1>
        <p className="text-gray-400 text-lg">Pay the creation fee and deploy a new Binary, Categorical or Scalar market</p>
      </div>

      <GlassCard>
        <div className="space-y-4">
          {/* Market type selection */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-40 font-medium">Market Type</label>
            <select
              value={marketType}
              onChange={(e) => setMarketType(e.target.value as 'binary' | 'categorical' | 'scalar')}
              className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="binary">Binary</option>
              <option value="categorical">Categorical</option>
              <option value="scalar">Scalar</option>
            </select>
          </div>
          {/* Market name */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-40 font-medium">Market Name</label>
            <input
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              placeholder="e.g. Will BTC > $100k by 2026?"
              className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          {/* Default parameters (collateral, oracle and questionId) are configured in the environment and are not exposed to end users. */}
          {/* Categorical fields */}
          {marketType === 'categorical' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="w-40 font-medium"># Outcomes</label>
                <input
                  type="number"
                  min={2}
                  value={numOutcomes}
                  onChange={(e) => setNumOutcomes(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="w-40 font-medium">Outcome Names</label>
                <input
                  value={outcomeNames}
                  onChange={(e) => setOutcomeNames(e.target.value)}
                  placeholder="Comma‑separated, e.g. Win,Lose,Draw"
                  className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </>
          )}
        {/* Scalar fields */}
        {marketType === 'scalar' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="w-40 font-medium">Min Value</label>
              <input
                value={scalarMin}
                onChange={(e) => setScalarMin(e.target.value)}
                placeholder="Minimum"
                className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="w-40 font-medium">Max Value</label>
              <input
                value={scalarMax}
                onChange={(e) => setScalarMax(e.target.value)}
                placeholder="Maximum"
                className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="w-40 font-medium">Decimals</label>
              <input
                type="number"
                min={0}
                value={scalarDecimals}
                onChange={(e) => setScalarDecimals(e.target.value)}
                className="flex-1 bg-neutral-900/60 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </>
        )}
          {/* Creation fee display */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-40 font-medium">Creation Fee</label>
            <div className="flex-1 px-3 py-2 text-white bg-neutral-900/60 border border-gray-700 rounded-lg">
              {creationFeeFormatted} (bond token units)
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex justify-end pt-4">
            <OutlineButton onClick={handleCreate} disabled={!isConnected || !selectedFactory}>
              <span className="font-cyber">Create Market</span>
            </OutlineButton>
          </div>
          {createdMarket && (
            <div className="mt-4 text-sm text-green-400 break-all">
              New market deployed at: {createdMarket}
            </div>
          )}
          {txHash && (
            <div className="mt-2 text-xs text-gray-500 break-all">
              Last tx hash: {txHash}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}