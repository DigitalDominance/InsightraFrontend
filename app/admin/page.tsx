"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/ui/glass-card";
import { Shield, CheckCircle, AlertTriangle, Plus, Ban, Gavel, Settings } from "lucide-react";
import { useAccount, useChainId, useSwitchChain, useWriteContract } from "wagmi";
import { config } from "@/lib/wagmi";
import { isAdmin as isAdminUtil } from "@/lib/admin";
import { FACTORIES, DEFAULT_ORACLE, DEFAULT_COLLATERAL } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

import { KAS_ORACLE_ABI, BINARY_FACTORY_ABI, CATEGORICAL_FACTORY_ABI, SCALAR_FACTORY_ABI } from "@/lib/abis";
import { decodeEventLog, keccak256, toHex, encodeAbiParameters, type Hex } from "viem";

// DAO admin address hard gate
const DAO_ADDRESS = "0xD031272E734F2B38515F2F55F2F935d3227b739d".toLowerCase();

const ORACLE_ADMIN_EXT = [
  {
    type: 'function',
    name: 'createQuestion',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'tuple',
        name: 'p',
        components: [
          { type: 'uint8',  name: 'qtype' },
          { type: 'uint32', name: 'options' },
          { type: 'int256', name: 'scalarMin' },
          { type: 'int256', name: 'scalarMax' },
          { type: 'uint32', name: 'scalarDecimals' },
          { type: 'uint32', name: 'timeout' },
          { type: 'uint8',  name: 'bondMultiplier' },
          { type: 'uint8',  name: 'maxRounds' },
          { type: 'bytes32',name: 'templateHash' },
          { type: 'string', name: 'dataSource' },
          { type: 'address',name: 'consumer' },
          { type: 'uint64', name: 'openingTs' }
        ]
      },
      { type: 'bytes32', name: 'salt' }
    ],
    outputs: [{ type: 'bytes32' }]
  }
] as const;

// Minimal market base + arbitrator ABIs
const MARKET_BASE_ABI = [
  { type: 'function', name: 'finalizeFromOracle', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;

const SIMPLE_ARBITRATOR_ABI = [
  { type: 'function', name: 'adminRule', stateMutability: 'nonpayable',
    inputs: [
      { name: 'questionId', type: 'bytes32' },
      { name: 'encodedOutcome', type: 'bytes' },
      { name: 'payee', type: 'address' },
    ],
    outputs: []
  }
] as const;

// helpers
const isHex32 = (v?: string) => !!v && /^0x[0-9a-fA-F]{64}$/.test(v.trim());
const normalizeHash = (h: any): Hex => (typeof h === 'string' ? h : (h?.hash as Hex));

type TabId = 'overview' | 'create' | 'moderate' | 'oracle' | 'factories' | 'resolution' | 'arbitration';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const [selectedTab, setSelectedTab] = useState<TabId>('overview');

  // strict admin gate
  const userIsAdmin = isConnected && !!address && (address.toLowerCase() === DAO_ADDRESS || isAdminUtil(address as `0x${string}`));

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center p-6">
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access admin panel.</p>
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
          <p className="text-gray-400">You don't have admin privileges.</p>
          <p className="text-xs text-gray-500 mt-2">Connected: {address}</p>
        </GlassCard>
      </div>
    );
  }

  // Ensure target chain
  const ensureChain = async () => {
    const requiredChainId = (config.chains?.[0]?.id as number | undefined) || chainId;
    if (requiredChainId && chainId !== requiredChainId) {
      await switchChainAsync({ chainId: requiredChainId });
    }
  };

  // ====================== Admin Create (owner path: no fee) ======================
  const [marketType, setMarketType] = useState<'binary' | 'categorical' | 'scalar'>('binary');
  const [marketName, setMarketName] = useState('');
  const [numOutcomes, setNumOutcomes] = useState(3);
  const [outcomeNames, setOutcomeNames] = useState('A,B,C');
  const [scalarMin, setScalarMin] = useState('0');
  const [scalarMax, setScalarMax] = useState('100');
  const [scalarDecimals, setScalarDecimals] = useState(2);
  const [creating, setCreating] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState<string>('');
  const [lastMarketAddress, setLastMarketAddress] = useState<string>('');

  const selectedFactory: Hex | undefined = useMemo(() => {
    if (marketType === 'binary') return FACTORIES.binary as Hex;
    if (marketType === 'categorical') return FACTORIES.categorical as Hex;
    return FACTORIES.scalar as Hex;
  }, [marketType]);

  const handleAdminCreate = async () => {
    if (creating) return;
    setCreating(true);
    setLastQuestionId('');
    setLastMarketAddress('');

    try {
      if (!DEFAULT_ORACLE || !DEFAULT_COLLATERAL || !selectedFactory) {
        toast({ title: 'Missing config', description: 'Oracle / Collateral / Factory addresses are not set.' });
        return;
      }

      await ensureChain();

      const nowSec = Math.floor(Date.now() / 1000);
      const openingTs = BigInt(nowSec + 3600);
      const timeout = 24 * 60 * 60;
      const bondMultiplier = 2;
      const maxRounds = 5;
      const name = (marketName || 'Untitled').trim();
      const templateHash = keccak256(toHex(name));
      const base = {
        timeout,
        bondMultiplier,
        maxRounds,
        templateHash,
        dataSource: 'WKAS',
        consumer: '0x0000000000000000000000000000000000000000',
        openingTs,
      };

      // Build QuestionParams object with explicit types
      const params =
        marketType === 'binary'
          ? {
              qtype: 0,
              options: 2,
              scalarMin: BigInt(0),
              scalarMax: BigInt(0),
              scalarDecimals: 0,
              ...base,
            }
          : marketType === 'categorical'
          ? {
              qtype: 1,
              options: Number(numOutcomes || 2),
              scalarMin: BigInt(0),
              scalarMax: BigInt(0),
              scalarDecimals: 0,
              ...base,
            }
          : {
              qtype: 2,
              options: 0,
              scalarMin: BigInt(scalarMin || '0'),
              scalarMax: BigInt(scalarMax || '0'),
              scalarDecimals: Number(scalarDecimals || 0),
              ...base,
            };

      const salt = keccak256(toHex(String(Date.now()) + (address || '0x')));

      // Owner path (no fee): createQuestion (present on oracle for admins)
      // NOTE: We call the *owner* function. If your oracle only exposes createQuestionPublic,
      // switch to that and ensure any ERC20 approvals are handled.
      console.debug('ORACLE createQuestion params:', params);
      const txHashLike = await writeContractAsync({
        address: DEFAULT_ORACLE as Hex,
        abi: [...KAS_ORACLE_ABI, ...ORACLE_ADMIN_EXT],
        functionName: 'createQuestion', // owner path
        args: [params as any, salt],
      });
      const txHash = normalizeHash(txHashLike);

      const receipt = await (await import('@wagmi/core')).waitForTransactionReceipt(config, { hash: txHash });

      // Find QuestionCreated(id) in logs
      let questionId: Hex | undefined;
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = decodeEventLog({
              abi: [...KAS_ORACLE_ABI, ...ORACLE_ADMIN_EXT],
              data: log.data as Hex,
              topics: log.topics as readonly Hex[],
            }) as any;
            if (parsed?.eventName === 'QuestionCreated') {
              questionId = parsed.args?.id as Hex;
              break;
            }
          } catch {}
        }
      } catch {}

      if (!questionId) {
        toast({ title: 'Oracle error', description: 'Could not read questionId from events.' });
        return;
      }
      setLastQuestionId(questionId);

      // Submit via factory
      let marketTx: Hex | undefined;
      if (marketType === 'binary') {
        marketTx = normalizeHash(await writeContractAsync({
          address: selectedFactory,
          abi: BINARY_FACTORY_ABI,
          functionName: 'submitBinary',
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, name],
        }));
      } else if (marketType === 'categorical') {
        const count = Number(numOutcomes || 2);
        const namesArray = outcomeNames.split(',').map(s => s.trim()).filter(Boolean);
        if (namesArray.length !== count) {
          toast({ title: 'Input mismatch', description: 'Outcome names must match number of outcomes.' });
          return;
        }
        marketTx = normalizeHash(await writeContractAsync({
          address: selectedFactory,
          abi: CATEGORICAL_FACTORY_ABI,
          functionName: 'submitCategorical',
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, name, count, namesArray],
        }));
      } else {
        marketTx = normalizeHash(await writeContractAsync({
          address: selectedFactory,
          abi: SCALAR_FACTORY_ABI,
          functionName: 'submitScalar',
          args: [DEFAULT_COLLATERAL as Hex, DEFAULT_ORACLE as Hex, questionId, name, BigInt(scalarMin || '0'), BigInt(scalarMax || '0'), Number(scalarDecimals || 0)],
        }));
      }

      const submitReceipt = await (await import('@wagmi/core')).waitForTransactionReceipt(config, { hash: marketTx! });
      console.debug('Factory submit receipt', submitReceipt);

      setLastMarketAddress('(see factory events)');
      toast({ title: 'Admin Market Created', description: 'Question + market deployed successfully.' });
    } catch (err: any) {
      console.error('Admin create error', err);
      toast({ title: 'Create failed', description: err?.shortMessage || err?.message || 'Unknown error' });
    } finally {
      setCreating(false);
    }
  };

  // ====================== Moderate (remove/restore) ======================
  const [modMarket, setModMarket] = useState('');
  const [modReason, setModReason] = useState('');
  const [modBusy, setModBusy] = useState(false);

  const multiWrite = async (calls: Array<{ address: Hex; abi: any; functionName: string; args: any[] }>) => {
    let lastErr: any;
    for (const c of calls) {
      try {
        const txLike = await writeContractAsync({ address: c.address, abi: c.abi, functionName: c.functionName as any, args: c.args });
        return normalizeHash(txLike);
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('All factory calls failed');
  };

  const handleRemoveListing = async () => {
    if (modBusy) return; setModBusy(true);
    try {
      await ensureChain();
      if (!modMarket) throw new Error('Market address required');
      const calls = [
        FACTORIES.binary && { address: FACTORIES.binary as Hex, abi: BINARY_FACTORY_ABI, functionName: 'removeListing', args: [modMarket as Hex, modReason || 'Removed by admin'] },
        FACTORIES.categorical && { address: FACTORIES.categorical as Hex, abi: CATEGORICAL_FACTORY_ABI, functionName: 'removeListing', args: [modMarket as Hex, modReason || 'Removed by admin'] },
        FACTORIES.scalar && { address: FACTORIES.scalar as Hex, abi: SCALAR_FACTORY_ABI, functionName: 'removeListing', args: [modMarket as Hex, modReason || 'Removed by admin'] },
      ].filter(Boolean) as any[];
      const tx = await multiWrite(calls);
      await (await import('@wagmi/core')).waitForTransactionReceipt(config, { hash: tx });
      toast({ title: 'Listing removed', description: 'Market has been unlisted.' });
    } catch (e: any) {
      toast({ title: 'Remove failed', description: e?.shortMessage || e?.message || 'Unknown error' });
    } finally { setModBusy(false); }
  };

  const handleRestoreListing = async () => {
    if (modBusy) return; setModBusy(true);
    try {
      await ensureChain();
      if (!modMarket) throw new Error('Market address required');
      const calls = [
        FACTORIES.binary && { address: FACTORIES.binary as Hex, abi: BINARY_FACTORY_ABI, functionName: 'restoreListing', args: [modMarket as Hex] },
        FACTORIES.categorical && { address: FACTORIES.categorical as Hex, abi: CATEGORICAL_FACTORY_ABI, functionName: 'restoreListing', args: [modMarket as Hex] },
        FACTORIES.scalar && { address: FACTORIES.scalar as Hex, abi: SCALAR_FACTORY_ABI, functionName: 'restoreListing', args: [modMarket as Hex] },
      ].filter(Boolean) as any[];
      const tx = await multiWrite(calls);
      await (await import('@wagmi/core')).waitForTransactionReceipt(config, { hash: tx });
      toast({ title: 'Listing restored', description: 'Market is visible again.' });
    } catch (e: any) {
      toast({ title: 'Restore failed', description: e?.shortMessage || e?.message || 'Unknown error' });
    } finally { setModBusy(false); }
  };

  // ====================== Oracle, Factories, Resolution, Arbitration ======================
  // keep as in your previous version, but replace ABIs with the imported ones for reads/writes

  // UI
  const tabs: Array<{ id: TabId; label: string; icon?: any }> = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'create', label: 'Admin Create', icon: Plus },
    { id: 'moderate', label: 'Moderate', icon: Ban },
    { id: 'oracle', label: 'Oracle', icon: Settings },
    { id: 'factories', label: 'Factories', icon: Gavel },
    { id: 'resolution', label: 'Resolution', icon: CheckCircle },
    { id: 'arbitration', label: 'Arbitration', icon: Gavel },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-[#49EACB]" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <p className="text-gray-400 text-lg">Manage markets and platform operations</p>
        <div className="text-xs text-gray-500">Admin: {address}</div>
      </div>

      <GlassCard>
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${selectedTab === tab.id ? 'bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black' : 'text-gray-300 hover:text-white border border-gray-600'}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {selectedTab === 'create' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Create New Market (Admin, no fee)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Market Type</label>
              <select className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={marketType} onChange={(e) => setMarketType(e.target.value as any)}>
                <option value="binary">Binary (Yes/No)</option>
                <option value="categorical">Categorical</option>
                <option value="scalar">Scalar</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm text-gray-300">Market Name</label>
              <input className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={marketName} onChange={(e) => setMarketName(e.target.value)} placeholder="e.g., Will BTC close above $90k on Dec 31?" />
            </div>

            {marketType === 'categorical' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300"># of Outcomes</label>
                  <input type="number" min={2} className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={numOutcomes} onChange={(e) => setNumOutcomes(parseInt(e.target.value || '2', 10))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Outcome Names</label>
                  <input className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={outcomeNames} onChange={(e) => setOutcomeNames(e.target.value)} placeholder="Yes,No OR A,B,C" />
                </div>
              </>
            )}

            {marketType === 'scalar' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Min</label>
                  <input className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={scalarMin} onChange={(e) => setScalarMin(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Max</label>
                  <input className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={scalarMax} onChange={(e) => setScalarMax(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm text-gray-300">Decimals</label>
                  <input type="number" min={0} className="md:col-span-2 bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white" value={scalarDecimals} onChange={(e) => setScalarDecimals(parseInt(e.target.value || '0', 10))} />
                </div>
              </>
            )}

            <button onClick={handleAdminCreate} disabled={creating} className="w-full py-3 bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity">
              {creating ? 'Creating…' : 'Create Market (Admin)'}
            </button>

            {(lastQuestionId || lastMarketAddress) && (
              <div className="text-xs text-gray-400 space-y-1">
                {lastQuestionId && <div>QuestionId: {lastQuestionId}</div>}
                {lastMarketAddress && <div>Market: {lastMarketAddress}</div>}
              </div>
            )}
          </div>
        )}

        {/* Render other tabs (overview/moderate/oracle/factories/resolution/arbitration) as in your previous file */}
      </GlassCard>
    </div>
  );
}
