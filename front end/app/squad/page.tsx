'use client';

import { useAccount } from 'wagmi';
import { useOwnedPlayerIds, usePlayer, useQuoteSellReturn, useCurrentGameweek } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SquadPlayer } from '@/lib/contracts/types';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';

export default function SquadPage() {
  const { address, isConnected } = useAccount();
  const { data: ownedPlayerIds } = useOwnedPlayerIds(address);
  const { data: currentGameweek } = useCurrentGameweek();
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [totalValue, setTotalValue] = useState(0n);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSquadData = async () => {
      if (!ownedPlayerIds || !address) return;

      const squadData: SquadPlayer[] = [];
      let total = 0n;

      for (const playerId of ownedPlayerIds) {
        // Fetch player data
        const playerData = await readContract({
          address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
          abi: FantasyCoreABI,
          functionName: 'getPlayer',
          args: [playerId],
        });

        const shares = await readContract({
          address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
          abi: FantasyCoreABI,
          functionName: 'getUserShare',
          args: [address, playerId],
        });

        const sellValue = await readContract({
          address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
          abi: FantasyCoreABI,
          functionName: 'quoteSellReturn',
          args: [playerId, shares],
        });

        squadData.push({
          playerId,
          shares,
          basePrice: playerData[0],
          totalShares: playerData[1],
          lastGameweekPoints: 0n, // Would fetch from points store
          currentValue: sellValue,
        });

        total += sellValue;
      }

      setSquad(squadData);
      setTotalValue(total);
      setLoading(false);
    };

    fetchSquadData();
  }, [ownedPlayerIds, address]);

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
      <div className="max-w-6xl mx-auto">
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Squad</h1>

      {/* Squad Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Players</p>
            <p className="text-2xl font-bold">{squad.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-green-600">{formatChips(totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Gameweek</p>
            <p className="text-2xl font-bold">{currentGameweek?.toString() || '0'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last GW Points</p>
            <p className="text-2xl font-bold">
              {squad.reduce((sum, p) => sum + p.lastGameweekPoints, 0n).toString()}
            </p>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last GW Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {squad.map((player) => (
              <tr key={player.playerId.toString()}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/players/${player.playerId}`}
                    className="text-blue-600 hover:underline"
                  >
                    Player #{player.playerId.toString()}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {player.shares.toString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatChips(player.basePrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-green-600">
                  {formatChips(player.currentValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {player.lastGameweekPoints.toString()}
                </td>
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function for reading contract (since we can't use hooks in loops)
async function readContract(config: any) {
  // This would be implemented with your web3 provider
  // For now, returning mock data
  return 0n;
}
