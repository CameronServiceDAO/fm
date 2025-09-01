import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet, localhost } from 'wagmi/chains';

// Contract Addresses (update with your deployed addresses)
export const CONTRACT_ADDRESSES = {
  fantasyCore: process.env.NEXT_PUBLIC_FANTASY_CORE_ADDRESS || '0x...',
  gameweekPointsStore: process.env.NEXT_PUBLIC_POINTS_STORE_ADDRESS || '0x...',
  mockUSDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x...',
} as const;

// Wagmi Configuration
export const config = getDefaultConfig({
  appName: 'Fantasy Sports Platform',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  chains: [process.env.NODE_ENV === 'production' ? mainnet : sepolia, localhost],
  ssr: true,
});

// Chain ID
export const CHAIN_ID = process.env.NODE_ENV === 'production' ? 1 : 11155111;
