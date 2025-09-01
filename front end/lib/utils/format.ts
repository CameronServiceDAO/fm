export function formatChips(chips: bigint): string {
  const value = Number(chips) / 1e18; // Assuming 18 decimals for chips
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function formatUSDC(usdc: bigint): string {
  const value = Number(usdc) / 1e6; // USDC has 6 decimals
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: bigint | number): string {
  return Number(num).toLocaleString('en-US');
}
