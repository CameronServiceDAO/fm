'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayer, useQuoteBuyCost, useQuoteSellReturn } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';
import { useAccount } from 'wagmi';
import { useFPLPlayer, useFPLPlayerLiveStats, useFPLCurrentGameweek } from '@/lib/hooks/useFPLData';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import toast from 'react-hot-toast';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const playerId = BigInt(params.id as string);
  
  // Blockchain data
  const { data: player } = usePlayer(playerId);
  const { data: buyPrice } = useQuoteBuyCost(playerId, 1n);
  const { data: sellPrice } = useQuoteSellReturn(playerId, 1n);
  
  // FPL data
  const { player: fplPlayer, isLoading: fplLoading } = useFPLPlayer(playerId);
  const { gameweek: currentGameweek } = useFPLCurrentGameweek();
  const { stats: liveStats } = useFPLPlayerLiveStats(
    playerId,
    currentGameweek?.id || null
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'fixtures'>('overview');
  const [tradeAmount, setTradeAmount] = useState('1');

  if (!player || fplLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-screen"></div>
    );
  }

  const [basePrice, shares, slope] = player;
  const fplData = fplPlayer?.fplData;

  const handleBuy = () => {
    router.push(`/trade?action=buy&player=${playerId}&amount=${tradeAmount}`);
  };

  const handleSell = () => {
    router.push(`/trade?action=sell&player=${playerId}&amount=${tradeAmount}`);
  };

  // Prepare chart data from FPL history
  const chartData = fplData ? Array.from({ length: currentGameweek?.id || 0 }, (_, i) => ({
    gameweek: `GW${i + 1}`,
    points: Math.floor(Math.random() * 15), // Would use actual history data
    form: parseFloat(fplData.form),
  })) : [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {fplData ? fplData.web_name : `Player #${playerId.toString()}`}
            </h1>
            {fplData && (
              <div className="flex gap-4 text-gray-600">
                <span>{fplPlayer?.position}</span>
                <span>•</span>
                <span>{fplPlayer?.team}</span>
                <span>•</span>
                <span className="text-green-600 font-semibold">
                  {fplData.total_points} pts
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">FPL Price</p>
          <p className="text-xl font-bold">
            {fplData ? `£${(fplData.now_cost / 10).toFixed(1)}m` : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Ownership</p>
          <p className="text-xl font-bold">
            {fplData ? `${parseFloat(fplData.selected_by_percent).toFixed(1)}%` : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Form</p>
          <p className={`text-xl font-bold ${
            fplData && parseFloat(fplData.form) > 5 ? 'text-green-600' : 'text-gray-900'
          }`}>
            {fplData ? parseFloat(fplData.form).toFixed(1) : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Buy Price</p>
          <p className="text-xl font-bold text-green-600">{formatChips(buyPrice || 0n)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Sell Price</p>
          <p className="text-xl font-bold text-red-600">{formatChips(sellPrice || 0n)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Shares</p>
          <p className="text-xl font-bold">{shares.toString()}</p>
        </div>
      </div>

      {/* Live Stats Card (if gameweek is active) */}
      {liveStats && currentGameweek?.is_current && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></span>
            Live GW{currentGameweek.id} Stats
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-gray-600">Points</p>
              <p className="text-2xl font-bold text-purple-600">{liveStats.stats?.total_points || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Minutes</p>
              <p className="text-2xl font-bold">{liveStats.stats?.minutes || 0}'</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Goals</p>
              <p className="text-2xl font-bold text-green-600">{liveStats.stats?.goals_scored || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Assists</p>
              <p className="text-2xl font-bold text-blue-600">{liveStats.stats?.assists || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bonus</p>
              <p className="text-2xl font-bold text-orange-600">{liveStats.stats?.bonus || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">BPS</p>
              <p className="text-2xl font-bold">{liveStats.stats?.bps || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Trading Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Trade</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Number of Shares</label>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              className="w-full p-3 border rounded-lg"
              min="1"
            />
          </div>
          <button
            onClick={handleBuy}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Buy Shares
          </button>
          <button
            onClick={handleSell}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sell Shares
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex gap-6 px-6">
            {['overview', 'stats', 'history', 'fixtures'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-4 capitalize font-semibold border-b-2 transition ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && fplData && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Points Per Game</p>
                  <p className="text-xl font-bold">{fplData.points_per_game}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">xG</p>
                  <p className="text-xl font-bold text-purple-600">
                    {parseFloat(fplData.expected_goals).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">xA</p>
                  <p className="text-xl font-bold text-blue-600">
                    {parseFloat(fplData.expected_assists).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ICT Index</p>
                  <p className="text-xl font-bold">{parseFloat(fplData.ict_index).toFixed(1)}</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Threat</p>
                  <p className="text-2xl font-bold text-red-600">
                    {parseFloat(fplData.threat).toFixed(1)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Creativity</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(fplData.creativity).toFixed(1)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Influence</p>
                  <p className="text-2xl font-bold text-green-600">
                    {parseFloat(fplData.influence).toFixed(1)}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">Form Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gameweek" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="points" stroke="#3B82F6" name="Points" />
                  <Line type="monotone" dataKey="form" stroke="#10B981" name="Form" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && fplData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Minutes Played</p>
                <p className="text-2xl font-bold">{fplData.minutes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Goals</p>
                <p className="text-2xl font-bold text-green-600">{fplData.goals_scored}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assists</p>
                <p className="text-2xl font-bold text-blue-600">{fplData.assists}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clean Sheets</p>
                <p className="text-2xl font-bold">{fplData.clean_sheets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yellow Cards</p>
                <p className="text-2xl font-bold text-yellow-600">{fplData.yellow_cards}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Red Cards</p>
                <p className="text-2xl font-bold text-red-600">{fplData.red_cards}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saves</p>
                <p className="text-2xl font-bold">{fplData.saves}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bonus Points</p>
                <p className="text-2xl font-bold text-purple-600">{fplData.bonus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Penalties Saved</p>
                <p className="text-2xl font-bold">{fplData.penalties_saved}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Penalties Missed</p>
                <p className="text-2xl font-bold">{fplData.penalties_missed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Own Goals</p>
                <p className="text-2xl font-bold">{fplData.own_goals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transfers In (GW)</p>
                <p className="text-2xl font-bold text-green-600">
                  {fplData.transfers_in_event.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* History and Fixtures tabs would be implemented similarly */}
        </div>
      </div>
    </div>
  );
}
