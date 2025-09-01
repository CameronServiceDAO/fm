'use client';

import { useAccount } from 'wagmi';
import { useChipBalance } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';

export function ChipBalance() {
  const { address } = useAccount();
  const { data: balance, isLoading } = useChipBalance(address);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Chips:</span>
      <span className="font-bold text-lg">{formatChips(balance || 0n)}</span>
    </div>
  );
}
