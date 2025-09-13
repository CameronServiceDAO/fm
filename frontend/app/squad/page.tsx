'use client';

import { useAccount } from 'wagmi';
import { useOwnedPlayerIds, useQuoteSellReturn, useChipBalance } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFPLCurrentGameweek, useFPLLiveData, useFPLPlayers } from '@/lib/hooks/useFPLData';
import toast from 'react-hot-toast';

interface SquadPlayerWithFPL {
  blockchainId: bigint;
  shares: bigint;
  currentValue: bigint;
  fplData?: any;
  liveStats?: any;
}

export default function SquadPage() {
  const { address, isConnected } = useAccount();
  const { data: ownedPlayerIds } = useOwnedPlayerIds(address);
  const { data: chipBalance } = useChipBalance(address);
  const { gameweek: currentGameweek } = useFPLCurrentGameweek();
  const { liveData } = useFPLLiveData(currentGameweek?.id || null);
  const { players: fplPlayers } = useFPLPlayers();
  
  const [squad, setSquad] = useState<SquadPlayerWithFPL[]>([]);
  const [totalValue, setTotalValue] = useState(0n);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [currentGWPoints, setCurrentGWPoints] = useState(0);
  const [projectedChips, setProjectedChips] = useState(0n);

  // Build squad with FPL data
  useEffect(() => {
    const buildSquad = async () => {
      if (!ownedPlayerIds || !address) return;

      const squadData: SquadPlayerWithFPL[] = [];
      let total = 0n;

      for (const playerId of ownedPlayerIds) {
        // Mock shares and value - in production get from contract
        const mockShares = BigInt(5);
        const mockSellValue = BigInt(5000) * BigInt(10 ** 18);

        // Find FPL data for this player
        const fplPlayer = fplPlayers?.find(p => p.blockchainId === playerId);
        const playerLiveStats = liveData?.find(l => l.blockchainId === playerId.toString());

        squadData.push({
          blockchainId: playerId,
          shares: mockShares,
          currentValue: mockSellValue,
          fplData: fplPlayer?.fplData,
          liveStats: playerLiveStats,
        });

        total += mockSellValue;
      }

      setSquad(squadData);
      setTotalValue(total);
      setLoading(false);
    };

    buildSquad();
  }, [ownedPlayerIds, address, fplPlayers, liveData]);

  // Calculate current gameweek points and projected chips
  useEffect(() => {
    let points = 0;
    let chips = 0n;
    
    squad.forEach((player) => {
      if (player.liveStats?.stats) {
        points += player.liveStats.stats.total_points;
        chips += BigInt(player.liveStats.stats.total_points) * player.shares * BigInt(10 ** 18);
      }
    });
    
    setCurrentGWPoints(points);
    setProjectedChips(chips);
  }, [squad]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">My Squad</h1>
        <p className="text-gray-600">Please connect your wallet to view your squad</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Squad</h1>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-32 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasLiveGames = currentGameweek && !currentGameweek.finished && currentGameweek.is_current;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Squad</h1>
        {hasLiveGames && (
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              isLive 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isLive ? '🔴 LIVE' : 'Enable Live Tracking'}
          </button>
        )}
      </div>

      {/* Squad Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Players</p>
            <p className="text-2xl font-bold">{squad.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Squad Value</p>
            <p className="text-2xl font-bold text-green-600">{formatChips(totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Chip Balance</p>
            <p className="text-2xl font-bold text-blue-600">{formatChips(chipBalance)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current GW</p>
            <p className="text-2xl font-bold">GW{currentGameweek?.id || '0'}</p>
          </div>
          <div className={isLive && hasLiveGames ? 'animate-pulse' : ''}>
            <p className="text-sm text-gray-600">Live Points</p>
            <p className="text-2xl font-bold text-purple-600">{currentGWPoints}</p>
          </div>
          <div className={isLive && hasLiveGames ? 'animate-pulse' : ''}>
            <p className="text-sm text-gray-600">Projected Chips</p>
            <p className="text-2xl font-bold text-orange-600">{formatChips(projectedChips)}</p>
          </div>
        </div>
      </div>

      {/* Live Match Status (if live) */}
      {isLive && hasLiveGames && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md p-6 mb-8 border-2 border-red-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></span>
            Live Gameweek {currentGameweek?.id} Updates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Players Playing</p>
              <p className="text-xl font-bold">
                {squad.filter(p => p.liveStats?.stats?.minutes > 0).length}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Total Goals</p>
              <p className="text-xl font-bold text-green-600">
                {squad.reduce((sum, p) => sum + (p.liveStats?.stats?.goals_scored || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Total Assists</p>
              <p className="text-xl font-bold text-blue-600">
                {squad.reduce((sum, p) => sum + (p.liveStats?.stats?.assists || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Average BPS</p>
              <p className="text-xl font-bold text-purple-600">
                {squad.length > 0 
                  ? Math.round(squad.reduce((sum, p) => sum + (p.liveStats?.stats?.bps || 0), 0) / squad.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Players Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              {isLive && hasLiveGames && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isLive && hasLiveGames ? 'Live Points' : 'Total Points'}
              </th>
              {isLive && hasLiveGames && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chips Earning
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {squad.map((player) => {
              const isPlaying = player.liveStats?.stats?.minutes > 0;
              return (
                <tr key={player.blockchainId.toString()} className={isPlaying && isLive ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/players/${player.blockchainId}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {player.fplData?.web_name || `Player #${player.blockchainId.toString()}`}
                    </Link>
                    {player.fplData && (
                      <p className="text-xs text-gray-500">{player.liveStats?.team || 'Unknown'}</p>
                    )}
                  </td>
                  {isLive && hasLiveGames && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        isPlaying
                          ? 'bg-green-100 text-green-800 animate-pulse' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isPlaying ? `Playing (${player.liveStats.stats.minutes}')` : 'Not Playing'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {player.liveStats?.position || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.shares.toString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">
                    {formatChips(player.currentValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${isLive && hasLiveGames && player.liveStats ? 'text-purple-600' : ''}`}>
                      {isLive && hasLiveGames && player.liveStats?.stats 
                        ? player.liveStats.stats.total_points 
                        : player.fplData?.total_points || 0}
                    </span>
                  </td>
                  {isLive && hasLiveGames && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {player.liveStats?.stats && (
                          <div className="flex gap-2 text-xs">
                            {player.liveStats.stats.goals_scored > 0 && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                ⚽ {player.liveStats.stats.goals_scored}
                              </span>
                            )}
                            {player.liveStats.stats.assists > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                🅰️ {player.liveStats.stats.assists}
                              </span>
                            )}
                            {player.liveStats.stats.yellow_cards > 0 && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                🟨 {player.liveStats.stats.yellow_cards}
                              </span>
                            )}
                            {player.liveStats.stats.saves > 0 && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                🧤 {player.liveStats.stats.saves}
                              </span>
                            )}
                            {player.liveStats.stats.bonus > 0 && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                ⭐ {player.liveStats.stats.bonus}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-orange-600 font-semibold">
                          {player.liveStats?.stats 
                            ? formatChips(BigInt(player.liveStats.stats.total_points) * player.shares * BigInt(10 ** 18))
                            : '0'
                          }
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        href={`/trade?action=buy&player=${player.blockchainId}`}
                        className="text-green-600 hover:underline"
                      >
                        Buy
                      </Link>
                      <Link
                        href={`/trade?action=sell&player=${player.blockchainId}`}
                        className="text-red-600 hover:underline"
                      >
                        Sell
                      </Link>
                      <Link
                        href={`/players/${player.blockchainId}`}
                        className="text-blue-600 hover:underline"
                      >
                        Stats
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FPL Stats Summary */}
      {squad.some(p => p.fplData) && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">Top Performers</h3>
            <div className="space-y-2">
              {squad
                .filter(p => p.fplData)
                .sort((a, b) => (b.fplData?.total_points || 0) - (a.fplData?.total_points || 0))
                .slice(0, 3)
                .map(player => (
                  <div key={player.blockchainId.toString()} className="flex justify-between">
                    <span>{player.fplData.web_name}</span>
                    <span className="font-bold">{player.fplData.total_points} pts</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">Best Form</h3>
            <div className="space-y-2">
              {squad
                .filter(p => p.fplData)
                .sort((a, b) => parseFloat(b.fplData?.form || '0') - parseFloat(a.fplData?.form || '0'))
                .slice(0, 3)
                .map(player => (
                  <div key={player.blockchainId.toString()} className="flex justify-between">
                    <span>{player.fplData.web_name}</span>
                    <span className="font-bold text-green-600">
                      {parseFloat(player.fplData.form).toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">Most Selected</h3>
            <div className="space-y-2">
              {squad
                .filter(p => p.fplData)
                .sort((a, b) => 
                  parseFloat(b.fplData?.selected_by_percent || '0') - 
                  parseFloat(a.fplData?.selected_by_percent || '0')
                )
                .slice(0, 3)
                .map(player => (
                  <div key={player.blockchainId.toString()} className="flex justify-between">
                    <span>{player.fplData.web_name}</span>
                    <span className="font-bold">
                      {parseFloat(player.fplData.selected_by_percent).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/trade"
          className="bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Trade Players
        </Link>
        <button
          onClick={() => toast.success('Chips claimed! (Mock)')}
          className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
        >
          Claim Chips
        </button>
        <Link
          href="/market"
          className="bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition"
        >
          Browse Market
        </Link>
      </div>
    </div>
  );
}
