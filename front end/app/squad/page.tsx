'use client';

import { useAccount } from 'wagmi';
import { useOwnedPlayerIds, usePlayer, useQuoteSellReturn, useCurrentGameweek, useChipBalance } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SquadPlayer } from '@/lib/contracts/types';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import GameweekPointsStoreABI from '@/lib/abis/GameweekPointsStore.json';
import toast from 'react-hot-toast';

interface LivePlayerStats {
  playerId: bigint;
  currentPoints: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  status: 'not_started' | 'playing' | 'benched' | 'finished';
}

export default function SquadPage() {
  const { address, isConnected } = useAccount();
  const { data: ownedPlayerIds } = useOwnedPlayerIds(address);
  const { data: currentGameweek } = useCurrentGameweek();
  const { data: chipBalance } = useChipBalance(address);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [liveStats, setLiveStats] = useState<Map<string, LivePlayerStats>>(new Map());
  const [totalValue, setTotalValue] = useState(0n);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [currentGWPoints, setCurrentGWPoints] = useState(0);
  const [projectedChips, setProjectedChips] = useState(0n);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive && ownedPlayerIds) {
        const newLiveStats = new Map<string, LivePlayerStats>();
        
        ownedPlayerIds.forEach(playerId => {
          const existing = liveStats.get(playerId.toString());
          const isPlaying = Math.random() > 0.3;
          
          newLiveStats.set(playerId.toString(), {
            playerId,
            currentPoints: existing?.currentPoints || Math.floor(Math.random() * 15),
            minutesPlayed: Math.min(90, (existing?.minutesPlayed || 0) + (isPlaying ? 5 : 0)),
            goals: existing?.goals || (Math.random() > 0.9 ? 1 : 0),
            assists: existing?.assists || (Math.random() > 0.85 ? 1 : 0),
            yellowCards: existing?.yellowCards || (Math.random() > 0.95 ? 1 : 0),
            redCards: 0,
            saves: existing?.saves || (Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0),
            status: isPlaying ? 'playing' : 'benched',
          });
        });
        
        setLiveStats(newLiveStats);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLive, ownedPlayerIds, liveStats]);

  useEffect(() => {
    const fetchSquadData = async () => {
      if (!ownedPlayerIds || !address) return;

      const squadData: SquadPlayer[] = [];
      let total = 0n;

      for (const playerId of ownedPlayerIds) {
        // Mock fetching player data - in production use proper contract reads
        const mockPlayerData = [
          BigInt(1000) * BigInt(10 ** 18), // basePrice
          BigInt(100), // totalShares
          BigInt(10) // slope
        ];

        const mockShares = BigInt(5);
        const mockSellValue = BigInt(5000) * BigInt(10 ** 18);

        squadData.push({
          playerId,
          shares: mockShares,
          basePrice: mockPlayerData[0],
          totalShares: mockPlayerData[1],
          lastGameweekPoints: BigInt(Math.floor(Math.random() * 15)),
          currentValue: mockSellValue,
        });

        total += mockSellValue;
      }

      setSquad(squadData);
      setTotalValue(total);
      setLoading(false);
    };

    fetchSquadData();
  }, [ownedPlayerIds, address]);

  // Calculate current gameweek points and projected chips
  useEffect(() => {
    let points = 0;
    let chips = 0n;
    
    liveStats.forEach((stats, playerId) => {
      points += stats.currentPoints;
      const playerSquad = squad.find(p => p.playerId.toString() === playerId);
      if (playerSquad) {
        chips += BigInt(stats.currentPoints) * playerSquad.shares * BigInt(10 ** 18);
      }
    });
    
    setCurrentGWPoints(points);
    setProjectedChips(chips);
  }, [liveStats, squad]);

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Squad</h1>
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
            <p className="text-2xl font-bold text-blue-600">{formatChips(chipBalance || 0n)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current GW</p>
            <p className="text-2xl font-bold">GW{currentGameweek?.toString() || '0'}</p>
          </div>
          <div className={isLive ? 'animate-pulse' : ''}>
            <p className="text-sm text-gray-600">Live Points</p>
            <p className="text-2xl font-bold text-purple-600">{currentGWPoints}</p>
          </div>
          <div className={isLive ? 'animate-pulse' : ''}>
            <p className="text-sm text-gray-600">Projected Chips</p>
            <p className="text-2xl font-bold text-orange-600">{formatChips(projectedChips)}</p>
          </div>
        </div>
      </div>

      {/* Live Match Status (if live) */}
      {isLive && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md p-6 mb-8 border-2 border-red-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></span>
            Live Gameweek {currentGameweek?.toString()} Updates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Players Playing</p>
              <p className="text-xl font-bold">
                {Array.from(liveStats.values()).filter(s => s.status === 'playing').length}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Total Goals</p>
              <p className="text-xl font-bold text-green-600">
                {Array.from(liveStats.values()).reduce((sum, s) => sum + s.goals, 0)}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-gray-600">Total Assists</p>
              <p className="text-xl font-bold text-blue-600">
                {Array.from(liveStats.values()).reduce((sum, s) => sum + s.assists, 0)}
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
              {isLive && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isLive ? 'Live Points' : 'Last GW Points'}
              </th>
              {isLive && (
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
              const liveData = liveStats.get(player.playerId.toString());
              return (
                <tr key={player.playerId.toString()} className={liveData?.status === 'playing' ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/players/${player.playerId}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Player #{player.playerId.toString()}
                    </Link>
                  </td>
                  {isLive && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        liveData?.status === 'playing' 
                          ? 'bg-green-100 text-green-800 animate-pulse' 
                          : liveData?.status === 'benched'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {liveData?.status === 'playing' ? `Playing (${liveData.minutesPlayed}')` : 
                         liveData?.status || 'Not Started'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.shares.toString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">
                    {formatChips(player.currentValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${isLive && liveData ? 'text-purple-600' : ''}`}>
                      {isLive && liveData ? liveData.currentPoints : player.lastGameweekPoints.toString()}
                    </span>
                  </td>
                  {isLive && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {liveData && (
                          <div className="flex gap-2 text-xs">
                            {liveData.goals > 0 && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                ⚽ {liveData.goals}
                              </span>
                            )}
                            {liveData.assists > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                🅰️ {liveData.assists}
                              </span>
                            )}
                            {liveData.yellowCards > 0 && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                🟨 {liveData.yellowCards}
                              </span>
                            )}
                            {liveData.saves > 0 && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                🧤 {liveData.saves}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-orange-600 font-semibold">
                          {liveData ? 
                            formatChips(BigInt(liveData.currentPoints) * player.shares * BigInt(10 ** 18)) : 
                            '0'
                          }
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        href={`/trade?action=buy&player=${player.playerId}`}
                        className="text-green-600 hover:underline"
                      >
                        Buy
                      </Link>
                      <Link
                        href={`/trade?action=sell&player=${player.playerId}`}
                        className="text-red-600 hover:underline"
                      >
                        Sell
                      </Link>
                      <Link
                        href={`/players/${player.playerId}`}
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
