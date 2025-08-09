"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FACTORIES } from '@/lib/contracts';
import { FACTORY_BASE_ABI, BINARY_MARKET_ABI } from '@/lib/abis';
import GlassCard from '@/components/ui/glass-card';
import { motion } from 'framer-motion';

/**
 * Home page for listing prediction markets.  Instead of static mock data, this
 * page queries the deployed factories on chain to discover all markets and
 * displays basic information such as market type, status and locked
 * collateral.  Users can click a market to view details and interact with
 * it.  If no markets exist, an informative message is shown.
 */
export default function MarketsPage() {
  const [markets, setMarkets] = useState<{
    address: `0x${string}`;
    type: number;
    status: number;
    locked: bigint;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarkets() {
      const { config } = await import('@/lib/wagmi');
      const client = config.publicClient;
      const addresses: `0x${string}`[] = [];
      // Collect all market addresses from each factory
      for (const key of ['binary', 'categorical', 'scalar'] as const) {
        const factoryAddr = FACTORIES[key];
        if (!factoryAddr) continue;
        try {
          const count: bigint = await client.readContract({
            address: factoryAddr as `0x${string}`,
            abi: FACTORY_BASE_ABI,
            functionName: 'marketCount',
          });
          for (let i = 0n; i < count; i++) {
            try {
              const addr = await client.readContract({
                address: factoryAddr as `0x${string}`,
                abi: FACTORY_BASE_ABI,
                functionName: 'allMarkets',
                args: [i],
              });
              addresses.push(addr as `0x${string}`);
            } catch {
              // ignore individual failures
            }
          }
        } catch {
          // ignore factory queries if the call fails
        }
      }
      // Query metadata for each market
      const details: {
        address: `0x${string}`;
        type: number;
        status: number;
        locked: bigint;
      }[] = [];
      for (const addr of addresses) {
        try {
          const type: bigint = await client.readContract({
            address: addr,
            abi: BINARY_MARKET_ABI,
            functionName: 'marketType',
          });
          const status: bigint = await client.readContract({
            address: addr,
            abi: BINARY_MARKET_ABI,
            functionName: 'status',
          });
          const locked: bigint = await client.readContract({
            address: addr,
            abi: BINARY_MARKET_ABI,
            functionName: 'collateralLocked',
          });
          details.push({ address: addr, type: Number(type), status: Number(status), locked });
        } catch {
          // skip markets that error
        }
      }
      setMarkets(details);
      setLoading(false);
    }
    loadMarkets();
  }, []);

  const statusLabel = (s: number) => {
    if (s === 0) return 'Open';
    if (s === 1) return 'Resolved';
    if (s === 2) return 'Cancelled';
    return 'Unknown';
  };
  const typeLabel = (t: number) => {
    if (t === 0) return 'Binary';
    if (t === 1) return 'Categorical';
    if (t === 2) return 'Scalar';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading markets…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-cyber font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
          PREDICTION MARKETS
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-sleek">
          Explore and trade on markets powered by the Insightra protocol
        </p>
      </motion.div>

      {/* Markets list */}
      {markets.length === 0 ? (
        <div className="p-6 text-center text-gray-400">No markets found.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => (
            <GlassCard key={m.address} className="p-4">
              <Link href={`/market/${m.address}`} className="block space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-cyber">
                    {typeLabel(m.type)} Market
                  </h3>
                  <span className="text-sm font-medium text-gray-400">
                    {statusLabel(m.status)}
                  </span>
                </div>
                <p className="text-gray-400 break-all text-sm">
                  {m.address}
                </p>
                <p className="text-gray-500 text-xs">
                  Locked: {m.locked.toString()}
                </p>
              </Link>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}