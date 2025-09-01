export interface Player {
  id: bigint;
  basePrice: bigint;
  shares: bigint;
  slope: bigint;
}

export interface User {
  wallet: string;
  chips: bigint;
  lastClaim: bigint;
  ownedPlayerIds: bigint[];
}

export interface TradeOp {
  action: number; // 0 = BUY, 1 = SELL
  playerId: bigint;
  shares: bigint;
  limit: bigint;
}

export interface PlayerWithPrices extends Player {
  currentBuyPrice: bigint;
  currentSellPrice: bigint;
  points?: bigint;
}

export interface SquadPlayer {
  playerId: bigint;
  shares: bigint;
  basePrice: bigint;
  totalShares: bigint;
  lastGameweekPoints: bigint;
  currentValue: bigint;
}
