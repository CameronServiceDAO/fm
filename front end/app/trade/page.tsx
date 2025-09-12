'use client';

import { TradeInterface } from '@/components/ui/TradeInterface';
import { useAccount } from 'wagmi';

export default function TradePage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Trade Players</h1>
        <p className="text-gray-600">Please connect your wallet to start trading</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Trade Players</h1>
      <TradeInterface />
    </div>
  );
}
