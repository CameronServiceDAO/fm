'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { useRouter } from 'next/navigation';

export default function MarketPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { data: nextPlayerId } = useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'nextPlayerId',
  });

  useEffect(() => {
    if (nextPlayerId) {
      const totalPlayers = Number(nextPlayerId) - 1;
      const playerIds = Array.from({ length: totalPlayers }, (_, i) => BigInt(i + 1));
      setPlayers(playerIds);
      setLoading(false);
    }
  }, [nextPlayerId]);

  const handleBuy = (playerId: bigint) => {
    router.push(`/trade?action=buy&player=${playerId}`);
  };

  const handleSell = (playerId: bigint) => {
    router.push(`/trade?action=sell&player=${playerId}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Player Market</h1>
        <div className="flex gap-4">
          <select className="p-2 border rounded">
            <option>All Positions</option>
            <option>Forwards</option>
            <option>Midfielders</option>
            <option>Defenders</option>
            <option>Goalkeepers</option>
          </select>
          <select className="p-2 border rounded">
            <option>Sort by Price</option>
            <option>Sort by Shares</option>
            <option>Sort by Points</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((playerId) => (
            <PlayerCard
              key={playerId.toString()}
              playerId={playerId}
              onBuy={() => handleBuy(playerId)}
              onSell={() => handleSell(playerId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
