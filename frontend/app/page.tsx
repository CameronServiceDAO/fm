'use client';

import { usePrizePool, useTotalChips, useCurrentGameweek, useTotalGameweeks } from '@/lib/contracts/hooks';
import { formatUSDC, formatChips } from '@/lib/utils/format';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function HomePage() {
  const { isConnected } = useAccount();
  const { data: prizePool } = usePrizePool();
  const { data: totalChips } = useTotalChips();
  const { data: currentGameweek } = useCurrentGameweek();
  const { data: totalGameweeks } = useTotalGameweeks();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">
          Fantasy Sports Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Trade player shares, earn chips, and win from the prize pool
        </p>
        {!isConnected ? (
          <div className="inline-block">
            <p className="mb-4 text-gray-600">Connect your wallet to get started</p>
          </div>
        ) : (
          <Link
            href="/register"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        )}
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Prize Pool</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatUSDC(prizePool)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Total Chips</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatChips(totalChips)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Current Gameweek</h3>
          <p className="text-2xl font-bold">
            {currentGameweek?.toString() || '0'} / {totalGameweeks?.toString() || '0'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Status</h3>
          <p className="text-2xl font-bold text-green-600">
            Active
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Buy Chips</h3>
            <p className="text-gray-600">
              Purchase chips with USDC to participate in the platform
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Trade Players</h3>
            <p className="text-gray-600">
              Buy and sell shares of players based on their performance
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
            <p className="text-gray-600">
              Earn chips from player points and redeem from the prize pool
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Playing?</h2>
        <p className="text-lg text-gray-600 mb-8">
          Join the decentralized fantasy sports revolution
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Register Now
          </Link>
          <Link
            href="/market"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Browse Players
          </Link>
        </div>
      </section>
    </div>
  );
}
