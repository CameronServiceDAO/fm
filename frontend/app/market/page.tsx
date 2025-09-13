'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FPLPlayer {
  blockchainId: string;
  fplId: number;
  name: string;
  team: string;
  position: string;
  fplData?: {
    web_name: string;
    total_points: number;
    now_cost: number;
    selected_by_percent: string;
    form: string;
    points_per_game: string;
  };
}

export default function MarketPage() {
  const [players, setPlayers] = useState<FPLPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('points');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/fpl/players');
      const data = await response.json();
      setPlayers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      // Use mock data if API fails
      setPlayers(getMockPlayers());
      setLoading(false);
    }
  };

  const getMockPlayers = () => [
    {
      blockchainId: '1',
      fplId: 318,
      name: 'Haaland',
      team: 'Man City',
      position: 'FWD',
      fplData: {
        web_name: 'Haaland',
        total_points: 89,
        now_cost: 150,
        selected_by_percent: '55.2',
        form: '8.5',
        points_per_game: '7.4'
      }
    },
    {
      blockchainId: '2',
      fplId: 277,
      name: 'Salah',
      team: 'Liverpool',
      position: 'MID',
      fplData: {
        web_name: 'Salah',
        total_points: 76,
        now_cost: 130,
        selected_by_percent: '42.1',
        form: '7.2',
        points_per_game: '6.3'
      }
    },
    // Add more mock players as needed
  ];

  const filteredPlayers = players.filter(player => {
    if (filter === 'ALL') return true;
    return player.position === filter;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'points') {
      return (b.fplData?.total_points || 0) - (a.fplData?.total_points || 0);
    } else if (sortBy === 'price') {
      return (b.fplData?.now_cost || 0) - (a.fplData?.now_cost || 0);
    } else if (sortBy === 'form') {
      return parseFloat(b.fplData?.form || '0') - parseFloat(a.fplData?.form || '0');
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Player Market</h1>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="ALL">All Positions</option>
            <option value="FWD">Forwards</option>
            <option value="MID">Midfielders</option>
            <option value="DEF">Defenders</option>
            <option value="GKP">Goalkeepers</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="points">Sort by Points</option>
            <option value="price">Sort by Price</option>
            <option value="form">Sort by Form</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPlayers.map((player) => (
            <div key={player.blockchainId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{player.fplData?.web_name || player.name}</h3>
                  <p className="text-sm text-gray-600">{player.team} • {player.position}</p>
                </div>
                <Link
                  href={`/players/${player.blockchainId}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Total Points</p>
                  <p className="font-bold text-lg text-green-600">
                    {player.fplData?.total_points || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Form</p>
                  <p className="font-bold text-lg text-blue-600">
                    {player.fplData?.form || '0.0'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">FPL Price</p>
                  <p className="font-semibold">
                    £{((player.fplData?.now_cost || 0) / 10).toFixed(1)}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Ownership</p>
                  <p className="font-semibold">
                    {player.fplData?.selected_by_percent || '0'}%
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Points per game</span>
                  <span className="font-semibold">{player.fplData?.points_per_game || '0.0'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedPlayers.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No players found. Try changing the filters.</p>
        </div>
      )}
    </div>
  );
}