'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import { formatChips, formatAddress } from '@/lib/utils/format';
import Link from 'next/link';

interface LeaderboardEntry {
  address: string;
  chips: bigint;
  percentPnL: number;
  rank: number;
  initialInvestment: bigint;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'chips' | 'pnl'>('chips');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // In production, you'd fetch this from an indexer or backend
  // For now, we'll use mock data
  useEffect(() => {
    // Mock data - replace with actual contract reads or indexer data
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        chips: BigInt(150000) * BigInt(10 ** 18),
        percentPnL: 250.5,
        rank: 1,
        initialInvestment: BigInt(60000) * BigInt(10 ** 18),
      },
      {
        address: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
        chips: BigInt(120000) * BigInt(10 ** 18),
        percentPnL: 180.2,
        rank: 2,
        initialInvestment: BigInt(66000) * BigInt(10 ** 18),
      },
      {
        address: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
        chips: BigInt(95000) * BigInt(10 ** 18),
        percentPnL: 95.5,
        rank: 3,
        initialInvestment: BigInt(48500) * BigInt(10 ** 18),
      },
      {
        address: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
        chips: BigInt(85000) * BigInt(10 ** 18),
        percentPnL: 70.0,
        rank: 4,
        initialInvestment: BigInt(50000) * BigInt(10 ** 18),
      },
      {
        address: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
        chips: BigInt(75000) * BigInt(10 ** 18),
        percentPnL: 50.0,
        rank: 5,
        initialInvestment: BigInt(50000) * BigInt(10 ** 18),
      },
    ];

    setLeaderboard(mockLeaderboard);
    setLoading(false);
  }, []);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (activeTab === 'chips') {
      return Number(b.chips - a.chips);
    } else {
      return b.percentPnL - a.percentPnL;
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      {/* Tab Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('chips')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'chips'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Total Chips
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'pnl'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          % PnL
        </button>
      </div>

      {/* Leaderboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Players</h3>
          <p className="text-2xl font-bold">{leaderboard.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-600 mb-2">Average Chips</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatChips(
              leaderboard.reduce((sum, entry) => sum + entry.chips, 0n) / BigInt(Math.max(leaderboard.length, 1))
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-600 mb-2">Average PnL</h3>
          <p className="text-2xl font-bold text-green-600">
            {(leaderboard.reduce((sum, entry) => sum + entry.percentPnL, 0) / Math.max(leaderboard.length, 1)).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Chips
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % PnL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLeaderboard.map((entry, index) => (
                <tr key={entry.address} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-lg font-semibold text-gray-600">#{index + 1}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {entry.address.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAddress(entry.address)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-blue-600">
                      {formatChips(entry.chips)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {formatChips(entry.initialInvestment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-semibold ${
                      entry.percentPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.percentPnL >= 0 ? '+' : ''}{entry.percentPnL.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/profile/${entry.address}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (for future implementation) */}
      <div className="mt-6 flex justify-center">
        <nav className="flex gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
            Previous
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">1</button>
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">2</button>
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">3</button>
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
