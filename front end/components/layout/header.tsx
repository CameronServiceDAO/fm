'use client';

import Link from 'next/link';
import { WalletConnection } from '../wallet/WalletConnection';
import { ChipBalance } from '../ui/ChipBalance';
import { useAccount } from 'wagmi';
import { useCurrentGameweek } from '@/lib/contracts/hooks';
import { useState } from 'react';

export function Header() {
  const { isConnected } = useAccount();
  const { data: currentGameweek } = useCurrentGameweek();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Market', href: '/market' },
    { name: 'Squad', href: '/squad' },
    { name: 'Trade', href: '/trade' },
    { name: 'Fixtures', href: '/fixtures' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Profile', href: '/profile' },
    { name: 'Chips', href: '/chips' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl">⚽</span>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Fantasy<span className="text-blue-600">Chain</span>
              </span>
            </Link>
            {currentGameweek && (
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                GW {currentGameweek.toString()}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Wallet Info */}
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="hidden md:block">
                <ChipBalance />
              </div>
            )}
            <WalletConnection />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                >
                  {item.name}
                </Link>
              ))}
              {isConnected && (
                <div className="px-3 py-2 border-t">
                  <ChipBalance />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
