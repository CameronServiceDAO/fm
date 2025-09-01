import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from './config';
import FantasyCoreABI from '../abis/FantasyCore.json';
import GameweekPointsStoreABI from '../abis/GameweekPointsStore.json';
import MockUSDCABI from '../abis/MockUSDC.json';
import { TradeOp } from './types';

// Read Hooks
export function useUserProfile(address?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'userProfiles',
    args: address ? [address] : undefined,
  });
}

export function useChipBalance(address?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'chipBalanceOf',
    args: address ? [address] : undefined,
  });
}

export function useCurrentGameweek() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'currentGameweek',
  });
}

export function useTotalGameweeks() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'totalGameweeks',
  });
}

export function usePrizePool() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'prizePool',
  });
}

export function useTotalChips() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'totalChips',
  });
}

export function usePlayer(playerId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'getPlayer',
    args: [playerId],
  });
}

export function useOwnedPlayerIds(address?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'getOwnedPlayerIds',
    args: address ? [address] : undefined,
  });
}

export function useQuoteBuyCost(playerId: bigint, shares: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'quoteBuyCost',
    args: [playerId, shares],
  });
}

export function useQuoteSellReturn(playerId: bigint, shares: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
    abi: FantasyCoreABI,
    functionName: 'quoteSellReturn',
    args: [playerId, shares],
  });
}

// Write Hooks
export function useRegister() {
  return useWriteContract();
}

export function useRegisterAndFund() {
  return useWriteContract();
}

export function useBuyChipsWithUSDC() {
  return useWriteContract();
}

export function useExecuteTrades() {
  return useWriteContract();
}

export function useClaimChips() {
  return useWriteContract();
}

export function useRedeemChips() {
  return useWriteContract();
}
