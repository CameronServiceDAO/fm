import { safeBigInt } from './safeBigint';

export function formatChips(chips: any): string {
  const chipsBigInt = safeBigInt(chips);
  const value = Number(chipsBigInt) / 1e18; // Assuming 18 decimals for chips
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function formatUSDC(usdc: any): string {
  const usdcBigInt = safeBigInt(usdc);
  const value = Number(usdcBigInt) / 1e6; // USDC has 6 decimals
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: any): string {
  const bigIntNum = safeBigInt(num);
  return Number(bigIntNum).toLocaleString('en-US');
}
