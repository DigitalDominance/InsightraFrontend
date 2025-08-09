"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/glass-card';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Plus, Calendar, DollarSign, Users, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { isAdmin } from '@/lib/admin';

// Mock admin data
const mockAdminData = {
  pendingMarkets: [
    {
      id: 1,
      title: "Will Ethereum 2.0 be fully deployed by Q2 2024?",
      creator: "0x1234...5678",
      created: "2024-01-15",
      liquidity: 5000,
      status: "pending",
    },
    {
      id: 2,
      title: "Will Tesla stock reach $300 by end of 2024?",
      creator: "0x8765...4321",
      created: "2024-01-14",
      liquidity: 3000,
      status: "pending",
    },
  ],
  marketsToResolve: [
    {
      id: 3,
      title: "Will Bitcoin reach $50,000 by January 2024?",
      endDate: "2024-01-31",
      volume: 125000,
      participants: 1247,
      status: "ended",
    },
  ],
  stats: {
    totalMarkets: 156,
    activeMarkets: 89,
    totalVolume: 2450000,
    totalUsers: 5678,
  },
};

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    endDate: '',
    initialLiquidity: '',
    fee: '2',
  });

  // Strict admin check - multiple layers of security
  const userIsAdmin = isConnected && isAdmin(address);

  // Block access immediately if not admin
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access admin panel</p>
        </GlassCard>
      </div>
    );
  }

  if (!userIsAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">You don't have admin privileges</p>
          <p className="text-xs text-gray-500 mt-2">Connected: {address}</p>
        </GlassCard>
      </div>
    );
  }

  const handleApproveMarket = (marketId: number) => {
    console.log('Approving market:', marketId);
    alert('Market approval functionality will be implemented with smart contracts!');
  };

  const handleRejectMarket = (marketId: number) => {
    console.log('Rejecting market:', marketId);
    alert('Market rejection functionality will be implemented with smart contracts!');
  };

  const handleResolveMarket = (marketId: number, outcome: 'yes' | 'no') => {
    console.log('Resolving market:', marketId, 'with outcome:', outcome);
    alert(`Market resolution functionality will be implemented with smart contracts!`);
  };

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating market with data:', formData);
    alert('Market creation functionality will be implemented with smart contracts!');
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: '',
      endDate: '',
      initialLiquidity: '',
      fee: '2',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'pending', label: 'Pending Approval', count: mockAdminData.pendingMarkets.length },
    { id: 'resolve', label: 'Markets to Resolve', count: mockAdminData.marketsToResolve.length },
    { id: 'create', label: 'Create Market', count: null },
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
        <p className="text-gray-400 text-lg">
          Manage markets and platform operations
        </p>
        <div className="text-xs text-gray-500">
          Admin: {address}
        </div>
      </motion.div>

      {/* Stats - Only show on overview */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{mockAdminData.stats.totalMarkets}</p>
              <p className="text-gray-400 text-sm">Total Markets</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{mockAdminData.stats.activeMarkets}</p>
              <p className="text-gray-400 text-sm">Active Markets</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#49EACB]">${mockAdminData.stats.totalVolume.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Total Volume</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#7C3AED]">{mockAdminData.stats.totalUsers.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Total Users</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tabs */}
      <GlassCard>
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black'
                  : 'text-gray-300 hover:text-white border border-gray-600'
              }`}
            >
              {tab.id === 'create' && <Plus className="w-4 h-4" />}
              {tab.label}
              {tab.count !== null && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedTab === tab.id ? 'bg-black/20' : 'bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-[#49EACB]">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Markets created today</span>
                    <span className="text-white">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Markets resolved today</span>
                    <span className="text-white">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">New users today</span>
                    <span className="text-white">24</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-[#7C3AED]">Pending Actions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Markets awaiting approval</span>
                    <span className="text-yellow-400">{mockAdminData.pendingMarkets.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Markets to resolve</span>
                    <span className="text-red-400">{mockAdminData.marketsToResolve.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Markets Tab */}
        {selectedTab === 'pending' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Pending Market Approvals</h3>
            {mockAdminData.pendingMarkets.map((market) => (
              <div key={market.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">{market.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Creator: {market.creator}</span>
                      <span>Created: {market.created}</span>
                      <span>Liquidity: {market.liquidity} KAS</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveMarket(market.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectMarket(market.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Markets to Resolve Tab */}
        {selectedTab === 'resolve' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Markets to Resolve</h3>
            {mockAdminData.marketsToResolve.map((market) => (
              <div key={market.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">{market.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Ended: {market.endDate}
                      </span>
                      <span>Volume: ${market.volume.toLocaleString()}</span>
                      <span>Participants: {market.participants}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveMarket(market.id, 'yes')}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Resolve YES
                    </button>
                    <button
                      onClick={() => handleResolveMarket(market.id, 'no')}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Resolve NO
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Market Tab */}
        {selectedTab === 'create' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Create New Market</h3>
            <form onSubmit={handleCreateMarket} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Market Question
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Will Bitcoin reach $100,000 by end of 2024?"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg focus:border-[#49EACB] focus:outline-none text-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context and resolution criteria..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg focus:border-[#49EACB] focus:outline-none text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg focus:border-[#49EACB] focus:outline-none text-white"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="crypto">Crypto</option>
                    <option value="technology">Technology</option>
                    <option value="space">Space</option>
                    <option value="politics">Politics</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg focus:border-[#49EACB] focus:outline-none text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <DollarSign className="inline w-4 h-4 mr-1" />
                    Initial Liquidity (KAS)
                  </label>
                  <input
                    type="number"
                    value={formData.initialLiquidity}
                    onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
                    placeholder="1000"
                    min="100"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg focus:border-[#49EACB] focus:outline-none text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Trading Fee (%)
                  </label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg focus:border-[#49EACB] focus:outline-none text-white"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Market Creation Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-200">
                      <li>Minimum initial liquidity: 100 KAS</li>
                      <li>Market must resolve within 2 years</li>
                      <li>Clear resolution criteria required</li>
                      <li>Admin markets are auto-approved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#49EACB] to-[#7C3AED] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
              >
                Create Market (Admin)
              </button>
            </form>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
