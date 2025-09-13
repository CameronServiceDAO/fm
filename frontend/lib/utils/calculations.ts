import { safeBigInt } from './safeBigint';

export function calculatePriceImpact(
  currentPrice: any,
  newPrice: any
): number {
  const currentPriceBigInt = safeBigInt(currentPrice);
  const newPriceBigInt = safeBigInt(newPrice);
  
  if (currentPriceBigInt === 0n) return 0;
  const impact = ((newPriceBigInt - currentPriceBigInt) * 10000n) / currentPriceBigInt;
  return Number(impact) / 100; // Return as percentage
}

export function calculateSlippage(
  expectedAmount: any,
  slippagePercent: number
): bigint {
  const expectedAmountBigInt = safeBigInt(expectedAmount);
  const slippageFactor = BigInt(Math.floor((100 + slippagePercent) * 100));
  return (expectedAmountBigInt * slippageFactor) / 10000n;
}

export function calculatePortfolioValue(
  players: Array<{ shares: any; sellPrice: any }>
): bigint {
  return players.reduce((total, player) => {
    const shares = safeBigInt(player.shares);
    const sellPrice = safeBigInt(player.sellPrice);
    return total + (shares * sellPrice);
  }, 0n);
}
