export function calculatePriceImpact(
  currentPrice: bigint,
  newPrice: bigint
): number {
  if (currentPrice === 0n) return 0;
  const impact = ((newPrice - currentPrice) * 10000n) / currentPrice;
  return Number(impact) / 100; // Return as percentage
}

export function calculateSlippage(
  expectedAmount: bigint,
  slippagePercent: number
): bigint {
  const slippageFactor = BigInt(Math.floor((100 + slippagePercent) * 100));
  return (expectedAmount * slippageFactor) / 10000n;
}

export function calculatePortfolioValue(
  players: Array<{ shares: bigint; sellPrice: bigint }>
): bigint {
  return players.reduce((total, player) => {
    return total + (player.shares * player.sellPrice);
  }, 0n);
}
