'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useUserProfile } from '@/lib/contracts/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { data: userProfile } = useUserProfile(address);
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address && userProfile) {
      const isRegistered = userProfile[0] !== '0x0000000000000000000000000000000000000000';
      if (!isRegistered) {
        router.push('/register');
      }
    }
  }, [isConnected, address, userProfile, router]);

  return <ConnectButton />;
}
