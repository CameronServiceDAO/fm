'use client';

import { useState, useEffect } from 'react';
import { usePlayer, useQuoteBuyCost, useQuoteSellReturn } from '@/lib/contracts/hooks';
import { formatChips, formatUSDC } from '@/lib/utils/format';
import Link from 'next/link';

interface PlayerCardProps {
  playerId: bigint;
  showActions?: boolean;
  onBuy?: () => void;
  onSell?: () => void;
}

export function PlayerCard({ playerId, showActions = true, onBuy, onSell }: PlayerCardProps) {
  const { data: player } = usePlayer(playerId);
  const { data: buyPrice } = useQuoteBuyCost(playerId, 1n);
  const { data: sellPrice } = useQuoteSellReturn(playerId, 1n);

  if (!player) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>;
  }

  const [basePrice, shares, slope] = player;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Player #{playerId.toString()}</h3>
          <p className="text-sm text-gray-600">Base Price: {formatChips(basePrice)}</p>
        </div>
        <Link href={`/players/${playerId}`} className="text-blue-600 hover:underline">
          View Details →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Buy Price</p>
          <p className="font-semibold">{formatChips(buyPrice || 0n)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Sell Price</p>
          <p className="font-semibold">{formatChips(sellPrice || 0n)}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Total Shares</p>
        <p className="font-semibold">{shares.toString()}</p>
      </div>
      
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={onBuy}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            Buy
          </button>
          <button
            onClick={onSell}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          >
            Sell
          </button>
        </div>
      )}
    </div>
  );
}
