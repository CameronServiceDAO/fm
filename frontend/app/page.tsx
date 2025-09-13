'use client';

import Link from 'next/link';

export default function HomePage() {
  // Mock data for display
  const stats = {
    prizePool: '$100,000',
    totalChips: '1M',
    currentGameweek: 10,
    totalPlayers: 500
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">
          Fantasy Sports Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Demo Version - FPL Data Integration
        </p>
        <Link
          href="/market"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          View Players
        </Link>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Prize Pool</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.prizePool}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Total Chips</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalChips}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Current Gameweek</h3>
          <p className="text-2xl font-bold">
            GW{stats.currentGameweek}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-sm text-gray-600 mb-2">Total Players</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.totalPlayers}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Available Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link href="/market" className="text-center group cursor-pointer">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
              <span className="text-2xl">⚽</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Player Market</h3>
            <p className="text-gray-600">
              Browse Premier League players with live FPL data
            </p>
          </Link>
          <Link href="/fixtures" className="text-center group cursor-pointer">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fixtures</h3>
            <p className="text-gray-600">
              View upcoming matches and results
            </p>
          </Link>
          <div className="text-center opacity-50">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-gray-600">
              Trading and squad management features
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
