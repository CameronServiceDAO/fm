'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-2xl">⚽</span>
              <span className="ml-2 text-xl font-bold">
                Fantasy<span className="text-blue-400">Chain</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Decentralized fantasy sports on the blockchain
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Play</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/market" className="hover:text-white transition">Player Market</Link></li>
              <li><Link href="/squad" className="hover:text-white transition">My Squad</Link></li>
              <li><Link href="/trade" className="hover:text-white transition">Trade Players</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition">Leaderboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/chips" className="hover:text-white transition">Buy Chips</Link></li>
              <li><Link href="/fixtures" className="hover:text-white transition">Fixtures</Link></li>
              <li><Link href="/profile" className="hover:text-white transition">Profile</Link></li>
              <li><Link href="/admin/sync" className="hover:text-white transition">Admin</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4">Information</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a 
                  href="https://github.com/Ampnoob/fm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  Smart Contracts
                </a>
              </li>
              <li>
                <a 
                  href="https://fantasy.premierleague.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  FPL Official
                </a>
              </li>
              <li>
                <a 
                  href="https://etherscan.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  Etherscan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2024 FantasyChain. All rights reserved.</p>
          <p className="mt-2">
            Data provided by Fantasy Premier League API
          </p>
        </div>
      </div>
    </footer>
  );
}
