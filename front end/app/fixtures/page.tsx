'use client';

import { useState, useEffect } from 'react';
import { useCurrentGameweek, useTotalGameweeks } from '@/lib/contracts/hooks';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  gameweek: number;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export default function FixturesPage() {
  const { data: currentGameweek } = useCurrentGameweek();
  const { data: totalGameweeks } = useTotalGameweeks();
  const [selectedGameweek, setSelectedGameweek] = useState<number>(Number(currentGameweek || 1));
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (currentGameweek) {
      setSelectedGameweek(Number(currentGameweek));
    }
  }, [currentGameweek]);

  useEffect(() => {
    // Mock fixtures data - in production, fetch from API or indexer
    const teams = [
      'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
      'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
      'Liverpool', 'Luton', 'Man City', 'Man United', 'Newcastle',
      'Nottm Forest', 'Sheffield Utd', 'Tottenham', 'West Ham', 'Wolves'
    ];

    const generateFixtures = (gw: number): Match[] => {
      const matches: Match[] = [];
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        const baseDate = new Date('2025-09-01');
        baseDate.setDate(baseDate.getDate() + (gw - 1) * 7 + Math.floor(i / 4));
        
        matches.push({
          id: `${gw}-${i/2}`,
          homeTeam: shuffledTeams[i],
          awayTeam: shuffledTeams[i + 1],
          date: baseDate.toISOString().split('T')[0],
          time: `${15 + Math.floor(Math.random() * 5)}:${Math.random() > 0.5 ? '00' : '30'}`,
          gameweek: gw,
          status: gw < Number(currentGameweek) ? 'finished' : 
                  gw === Number(currentGameweek) ? (Math.random() > 0.5 ? 'live' : 'scheduled') : 
                  'scheduled',
          homeScore: gw < Number(currentGameweek) ? Math.floor(Math.random() * 4) : undefined,
          awayScore: gw < Number(currentGameweek) ? Math.floor(Math.random() * 4) : undefined,
        });
      }
      
      return matches;
    };

    setFixtures(generateFixtures(selectedGameweek));
  }, [selectedGameweek, currentGameweek]);

  const gameweeks = Array.from({ length: Number(totalGameweeks || 38) }, (_, i) => i + 1);

  const getTeamForm = (team: string): string[] => {
    // Mock form data (last 5 games)
    return Array.from({ length: 5 }, () => {
      const rand = Math.random();
      return rand > 0.6 ? 'W' : rand > 0.3 ? 'D' : 'L';
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Fixtures & Results</h1>

      {/* Gameweek Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gameweek {selectedGameweek}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {gameweeks.map((gw) => (
            <button
              key={gw}
              onClick={() => setSelectedGameweek(gw)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                gw === selectedGameweek
                  ? 'bg-blue-600 text-white'
                  : gw === Number(currentGameweek)
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : gw < Number(currentGameweek || 0)
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              GW{gw}
              {gw === Number(currentGameweek) && (
                <span className="ml-1 text-xs">(Current)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fixtures Display */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {fixtures.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <p className="text-lg font-semibold">{match.homeTeam}</p>
                      <div className="flex justify-end gap-1 mt-1">
                        {getTeamForm(match.homeTeam).map((result, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                              result === 'W' ? 'bg-green-500 text-white' :
                              result === 'D' ? 'bg-gray-400 text-white' :
                              'bg-red-500 text-white'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mx-8 text-center">
                      {match.status === 'finished' ? (
                        <div className="text-2xl font-bold">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : match.status === 'live' ? (
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {match.homeScore || 0} - {match.awayScore || 0}
                          </div>
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded animate-pulse">
                            LIVE
                          </span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600">{match.time}</p>
                          <p className="text-sm text-gray-500">{match.date}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{match.awayTeam}</p>
                      <div className="flex gap-1 mt-1">
                        {getTeamForm(match.awayTeam).map((result, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                              result === 'W' ? 'bg-green-500 text-white' :
                              result === 'D' ? 'bg-gray-400 text-white' :
                              'bg-red-500 text-white'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Calendar View
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-7 gap-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date('2025-09-01');
              date.setDate(date.getDate() + (selectedGameweek - 1) * 7 + i);
              const dateStr = date.toISOString().split('T')[0];
              const dayFixtures = fixtures.filter(f => f.date === dateStr);
              
              return (
                <div key={i} className="border rounded-lg p-2 min-h-[150px]">
                  <p className="text-sm font-semibold mb-2">{date.getDate()}</p>
                  {dayFixtures.map((match) => (
                    <div key={match.id} className="text-xs mb-1 p-1 bg-gray-50 rounded">
                      <p className="font-semibold">{match.time}</p>
                      <p>{match.homeTeam.slice(0, 3)} v {match.awayTeam.slice(0, 3)}</p>
                      {match.status === 'finished' && (
                        <p className="text-gray-600">{match.homeScore}-{match.awayScore}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Top Scorers</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Haaland (MCI)</span>
              <span className="font-bold">24 goals</span>
            </div>
            <div className="flex justify-between">
              <span>Salah (LIV)</span>
              <span className="font-bold">19 goals</span>
            </div>
            <div className="flex justify-between">
              <span>Watkins (AVL)</span>
              <span className="font-bold">16 goals</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Most Assists</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>De Bruyne (MCI)</span>
              <span className="font-bold">15 assists</span>
            </div>
            <div className="flex justify-between">
              <span>Odegaard (ARS)</span>
              <span className="font-bold">12 assists</span>
            </div>
            <div className="flex justify-between">
              <span>Bruno (MUN)</span>
              <span className="font-bold">11 assists</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Clean Sheets</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Alisson (LIV)</span>
              <span className="font-bold">14 CS</span>
            </div>
            <div className="flex justify-between">
              <span>Ederson (MCI)</span>
              <span className="font-bold">12 CS</span>
            </div>
            <div className="flex justify-between">
              <span>Raya (ARS)</span>
              <span className="font-bold">11 CS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
