"use client";

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/glass-card';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useAccount } from 'wagmi';

// Mock portfolio data
const mockPortfolio = {
  totalValue: 2450.75,
  totalPnL: 245.30,
  pnlPercentage: 11.1,
  positions: [
    {
      id: 1,
      market: "Will Bitcoin reach $100,000 by end of 2024?",
      position: "YES",
      shares: 100,
      avgPrice: 0.65,
      currentPrice: 0.68,
      value: 68,
      pnl: 3,
    },
    {
      id: 2,
      market: "Will AI achieve AGI by 2025?",
      position: "NO",
      shares: 200,
      avgPrice: 0.77,
      currentPrice: 0.75,
      value: 150,
      pnl: -4,
    },
  ],
  history: [
    { date: "2024-01-15", action: "Buy YES", market: "Bitcoin $100k", amount: 65 },
    { date: "2024-01-14", action: "Buy NO", market: "AI AGI 2025", amount: 154 },
  ],
};

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#49EACB] to-[#7C3AED] bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="text-gray-400 text-lg">
          Track your prediction market positions and performance
        </p>
      </motion.div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-white">
                ${mockPortfolio.totalValue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-[#49EACB]" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total P&L</p>
              <p className={`text-2xl font-bold ${mockPortfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${mockPortfolio.totalPnL.toFixed(2)}
              </p>
            </div>
            {mockPortfolio.totalPnL >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-400" />
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">P&L Percentage</p>
              <p className={`text-2xl font-bold ${mockPortfolio.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mockPortfolio.pnlPercentage >= 0 ? '+' : ''}{mockPortfolio.pnlPercentage}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-[#7C3AED]" />
          </div>
        </GlassCard>
      </div>

      {/* Active Positions */}
      <GlassCard>
        <h2 className="text-xl font-bold mb-6">Active Positions</h2>
        <div className="space-y-4">
          {mockPortfolio.positions.map((position) => (
            <div key={position.id} className="border border-gray-700 rounded-lg p-4 bg-black/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{position.market}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className={`px-2 py-1 rounded ${
                      position.position === 'YES' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {position.position}
                    </span>
                    <span>{position.shares} shares</span>
                    <span>Avg: ${position.avgPrice}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">${position.value}</p>
                  <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.pnl >= 0 ? '+' : ''}${position.pnl}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Transaction History */}
      <GlassCard>
        <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {mockPortfolio.history.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
              <div>
                <p className="text-white font-medium">{transaction.action}</p>
                <p className="text-gray-400 text-sm">{transaction.market}</p>
              </div>
              <div className="text-right">
                <p className="text-white">${transaction.amount}</p>
                <p className="text-gray-400 text-sm">{transaction.date}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
