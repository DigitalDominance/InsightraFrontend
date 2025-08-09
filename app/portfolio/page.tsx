"use client";

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { FACTORIES } from '@/lib/contracts';
import {
  FACTORY_BASE_ABI,
  BINARY_MARKET_ABI,
  ERC20_ABI,
} from '@/lib/abis';
import GlassCard from '@/components/ui/glass-card';
import { OutlineButton } from '@/components/ui/gradient-outline';

/**
 * Portfolio page for Insightra users.  Instead of static mock data, this page
 * queries all markets from the deployed factories and inspects the user's
 * balances for each outcome token.  It displays a list of positions and the
 * number of tokens held.  This page intentionally omits P&L and pricing
 * calculations, as those depend on off-chain price discovery.
 */
export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<{
    market: `0x${string}`;
    type: number;
    holdings: { token: `0x${string}`; amount: bigint }[];
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPositions() {
      if (!isConnected || !address) {
        setPositions([]);
        setLoading(false);
        return;
      }
      const { config } = await import('@/lib/wagmi');
      const client = config.publicClient;
      // Discover all markets across all factories
      const markets: `0x${string}`[] = [];
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
              markets.push(addr as `0x${string}`);
            } catch {}
          }
        } catch {}
      }
      // For each market, fetch type and tokens and user balances
      const userPositions: {
        market: `0x${string}`;
        type: number;
        holdings: { token: `0x${string}`; amount: bigint }[];
      }[] = [];
      for (const mAddr of markets) {
        try {
          // Read the market type once; use the base ABI (Binary ABI includes marketType)
          const type: bigint = await client.readContract({
            address: mAddr,
            abi: BINARY_MARKET_ABI,
            functionName: 'marketType',
          });
          const mt = Number(type);
          // Choose the appropriate ABI to fetch outcome tokens
          let tokens: `0x${string}`[] = [];
          if (mt === 0) {
            // Binary: yes/no tokens
            const yes: `0x${string}` = await client.readContract({ address: mAddr, abi: BINARY_MARKET_ABI, functionName: 'yesToken' });
            const no: `0x${string}` = await client.readContract({ address: mAddr, abi: BINARY_MARKET_ABI, functionName: 'noToken' });
            tokens = [yes, no];
          } else if (mt === 1) {
            // Categorical: use categorical ABI for outcomeCount and tokens
            const { CATEGORICAL_MARKET_ABI } = await import('@/lib/abis');
            const count: bigint = await client.readContract({ address: mAddr, abi: CATEGORICAL_MARKET_ABI, functionName: 'outcomeCount' });
            const cnt = Number(count);
            for (let i = 0; i < cnt; i++) {
              try {
                const tk: `0x${string}` = await client.readContract({ address: mAddr, abi: CATEGORICAL_MARKET_ABI, functionName: 'tokens', args: [i] });
                tokens.push(tk);
              } catch {}
            }
          } else if (mt === 2) {
            // Scalar: use scalar ABI for long/short tokens
            const { SCALAR_MARKET_ABI } = await import('@/lib/abis');
            const long: `0x${string}` = await client.readContract({ address: mAddr, abi: SCALAR_MARKET_ABI, functionName: 'longToken' });
            const short: `0x${string}` = await client.readContract({ address: mAddr, abi: SCALAR_MARKET_ABI, functionName: 'shortToken' });
            tokens = [long, short];
          }
          // Now query the user's balance for each outcome token
          const holdings: { token: `0x${string}`; amount: bigint }[] = [];
          for (const tk of tokens) {
            try {
              const bal: bigint = await client.readContract({
                address: tk,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address],
              });
              if (bal > 0n) {
                holdings.push({ token: tk, amount: bal });
              }
            } catch {}
          }
          if (holdings.length > 0) {
            userPositions.push({ market: mAddr, type: mt, holdings });
          }
        } catch {
          // Ignore markets that fail to query
        }
      }
      setPositions(userPositions);
      setLoading(false);
    }
    loadPositions();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view your portfolio</p>
        </GlassCard>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading your positions…
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-cyber font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
          Your Portfolio
        </h1>
        <p className="text-gray-400 text-lg">
          Overview of your positions in active markets
        </p>
      </div>
      {positions.length === 0 ? (
        <GlassCard>
          <p className="p-4 text-center text-gray-400">You currently have no positions.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {positions.map((pos) => (
            <GlassCard key={pos.market} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-cyber font-bold text-lg">
                    Market {pos.type === 0 ? 'Binary' : pos.type === 1 ? 'Categorical' : pos.type === 2 ? 'Scalar' : 'Unknown'}
                  </h3>
                  <p className="text-gray-400 text-sm break-all">{pos.market}</p>
                </div>
              </div>
              <div className="space-y-2">
                {pos.holdings.map((h) => (
                  <div key={h.token} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 break-all">{h.token}</span>
                    <span className="text-white font-mono">{h.amount.toString()}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}