'use client';

import { useAccount } from 'wagmi';
import { useChipBalance, useOwnedPlayerIds, useUserProfile, useClaimChips } from '@/lib/contracts/hooks';
import { formatChips } from '@/lib/utils/format';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import FantasyCoreABI from '@/lib/abis/FantasyCore.json';
import { useWriteContract } from 'wagmi';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: chipBalance } = useChipBalance(address);
  const { data: ownedPlayerIds } = useOwnedPlayerIds(address);
  const { data: userProfile } = useUserProfile(address);
  const { writeContract: claimChips, isPending: isClaiming } = useWriteContract();

  const handleClaimChips = async () => {
    if (!ownedPlayerIds || ownedPlayerIds.length === 0) {
      toast.error('No players to claim chips for');
      return;
    }

    try {
      await claimChips({
        address: CONTRACT_ADDRESSES.fantasyCore as `0x${string}`,
        abi: FantasyCoreABI,
        functionName: 'claimChips',
        args: [ownedPlayerIds],
      });
      toast.success('Chips claimed successfully!');
    } catch (error) {
      toast.error('Failed to claim chips');
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <p className="text-gray-600">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  const isRegistered = userProfile && userProfile[0] !== '0x0000000000000000000000000000000000000000';

  if (!isRegistered) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Not Registered</h1>
        <p className="text-gray-600 mb-8">You need to register first</p>
        <Link
          href="/register"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Register Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      {/* Account Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Wallet Address</p>
            <p className="font-mono text-sm">{address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Registration Status</p>
            <p className="font-semibold text-green-600">Registered ✓</p>
          </div>
        </div>
      </div>

      {/* Chip Balance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chip Balance</h2>
          <button
            onClick={handleClaimChips}
            disabled={isClaiming || !ownedPlayerIds || ownedPlayerIds.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            {isClaiming ? 'Claiming...' : 'Claim Chips'}
          </button>
        </div>
        <div className="text-3xl font-bold text-blue-600">
          {formatChips(chipBalance)}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Available for trading and redemption
        </p>
      </div>

      {/* Owned Players */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Players</h2>
          <Link
            href="/squad"
            className="text-blue-600 hover:underline"
          >
            View Squad →
          </Link>
        </div>
        <div>
          <p className="text-lg">
            <span className="font-semibold">{ownedPlayerIds?.length || 0}</span> Players Owned
          </p>
          {ownedPlayerIds && ownedPlayerIds.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {ownedPlayerIds.slice(0, 10).map((id) => (
                <Link
                  key={id.toString()}
                  href={`/players/${id}`}
                  className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition"
                >
                  Player #{id.toString()}
                </Link>
              ))}
              {ownedPlayerIds.length > 10 && (
                <span className="text-gray-600 px-3 py-1">
                  +{ownedPlayerIds.length - 10} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/chips"
          className="bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Buy More Chips
        </Link>
        <Link
          href="/market"
          className="bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition"
        >
          Browse Players
        </Link>
        <Link
          href="/trade"
          className="bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition"
        >
          Trade Players
        </Link>
      </div>
    </div>
  );
}
