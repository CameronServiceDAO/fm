'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayer, useQuoteBuyCost, useQuoteSellReturn, useCurrentGameweek } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import GameweekPointsStoreABI from '@/lib/abis/GameweekPointsStore.json';
import { Line } from 'recharts';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface PlayerStats {
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
}

interface GameweekPerformance {
  gameweek: number;
  points: number;
  chipsEarned: bigint;
}

interface Fixture {
  gameweek: number;
  opponent: string;
  home: boolean;
  date: string;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const playerId = BigInt(params.id as string);
  
  const { data: player } = usePlayer(playerId);
  const { data: buyPrice } = useQuoteBuyCost(playerId, 1n);
  const { data: sellPrice } = useQuoteSellReturn(playerId, 1n);
  const { data: currentGameweek } = useCurrentGameweek();

  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'fixtures'>('overview');
  const [tradeAmount, setTradeAmount] = useState('1');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [performances, setPerformances] = useState<GameweekPerformance[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  // Fetch player stats and performances
  useEffect(() => {
    // Mock data - in production, fetch from indexer or backend
    setStats({
      minutesPlayed: 2340,
      goals: 12,
      assists: 8,
      cleanSheets: 15,
      yellowCards: 3,
      redCards: 0,
      saves: 0,
      bonus: 24,
    });

    // Mock performance history
    const mockPerformances: GameweekPerformance[] = [];
    for (let i = 1; i <= Number(currentGameweek || 0); i++) {
      mockPerformances.push({
        gameweek: i,
        points: Math.floor(Math.random() * 15),
        chipsEarned: BigInt(Math.floor(Math.random() * 1000)) * BigInt(10 ** 18),
      });
    }
    setPerformances(mockPerformances);

    // Mock fixtures
    setFixtures([
      { gameweek: Number(currentGameweek || 0) + 1, opponent: 'Liverpool', home: true, date: '2025-09-14' },
      { gameweek: Number(currentGameweek || 0) + 2, opponent: 'Arsenal', home: false, date: '2025-09-21' },
      { gameweek: Number(currentGameweek || 0) + 3, opponent: 'Chelsea', home: true, date: '2025-09-28' },
      { gameweek: Number(currentGameweek || 0) + 4, opponent: 'Man United', home: false, date: '2025-10-05' },
      { gameweek: Number(currentGameweek || 0) + 5, opponent: 'Tottenham', home: true, date: '2025-10-12' },
    ]);
  }, [currentGameweek]);

  if (!player) {
    return <div className="animate-pulse bg-gray-200 h-screen"></div>;
  }

  const [basePrice, shares, slope] = player;

  const handleBuy = () => {
    router.push(`/trade?action=buy&player=${playerId}&amount=${tradeAmount}`);
  };

  const handleSell = () => {
    router.push(`/trade?action=sell&player=${playerId}&amount=${tradeAmount}`);
  };

  const chartData = performances.map(p => ({
    gameweek: `GW${p.gameweek}`,
    points: p.points,
    chips: Number(p.chipsEarned) / (10 ** 18),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Player #{playerId.toString()}</h1>
            <p className="text-gray-600">Forward • Manchester City</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Base Price</p>
          <p className="text-xl font-bold">{formatChips(basePrice)}</p>
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
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Slope</p>
          <p className="text-xl font-bold">{slope.toString()}</p>
        </div>
      </div>

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
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Performance Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gameweek" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="points"
                    stroke="#3B82F6"
                    name="Points"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="chips"
                    stroke="#10B981"
                    name="Chips Earned"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Minutes Played</p>
                <p className="text-2xl font-bold">{stats.minutesPlayed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Goals</p>
                <p className="text-2xl font-bold text-green-600">{stats.goals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assists</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assists}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clean Sheets</p>
                <p className="text-2xl font-bold">{stats.cleanSheets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yellow Cards</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.yellowCards}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Red Cards</p>
                <p className="text-2xl font-bold text-red-600">{stats.redCards}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saves</p>
                <p className="text-2xl font-bold">{stats.saves}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bonus Points</p>
                <p className="text-2xl font-bold text-purple-600">{stats.bonus}</p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Gameweek</th>
                    <th className="text-left py-2">Points</th>
                    <th className="text-left py-2">Chips Earned</th>
                    <th className="text-left py-2">Chips/Point</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map((perf) => (
                    <tr key={perf.gameweek} className="border-b">
                      <td className="py-2">GW{perf.gameweek}</td>
                      <td className="py-2 font-semibold">{perf.points}</td>
                      <td className="py-2 text-green-600">{formatChips(perf.chipsEarned)}</td>
                      <td className="py-2">
                        {perf.points > 0 
                          ? formatChips(perf.chipsEarned / BigInt(perf.points))
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fixtures Tab */}
          {activeTab === 'fixtures' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Fixtures</h3>
              <div className="space-y-3">
                {fixtures.map((fixture) => (
                  <div
                    key={fixture.gameweek}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-600">
                        GW{fixture.gameweek}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        fixture.home ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {fixture.home ? 'Home' : 'Away'}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{fixture.opponent}</p>
                      <p className="text-sm text-gray-600">{fixture.date}</p>
                    </div>
                    <div className={`px-3 py-1 rounded ${
                      fixture.opponent.includes('Liverpool') || fixture.opponent.includes('Arsenal')
                        ? 'bg-red-100 text-red-800'
                        : fixture.opponent.includes('Chelsea') || fixture.opponent.includes('Man United')
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {fixture.opponent.includes('Liverpool') || fixture.opponent.includes('Arsenal')
                        ? 'Hard'
                        : fixture.opponent.includes('Chelsea') || fixture.opponent.includes('Man United')
                        ? 'Medium'
                        : 'Easy'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
