'use client';

import { useState, useEffect } from 'react';
import { useFPLFixtures, useFPLGameweeks, useFPLCurrentGameweek } from '@/lib/hooks/useFPLData';

export default function FixturesPage() {
  const { gameweek: currentGameweek } = useFPLCurrentGameweek();
  const { gameweeks } = useFPLGameweeks();
  const [selectedGameweek, setSelectedGameweek] = useState<number>(0);
  const { fixtures, isLoading } = useFPLFixtures(selectedGameweek || undefined);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (currentGameweek) {
      setSelectedGameweek(currentGameweek.id);
    }
  }, [currentGameweek]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (fixture: any) => {
    if (fixture.finished) {
      return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">FT</span>;
    }
    if (fixture.started) {
      return (
        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded animate-pulse">
          LIVE
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Fixtures & Results</h1>

      {/* Gameweek Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedGameweek ? `Gameweek ${selectedGameweek}` : 'All Fixtures'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedGameweek(0)}
              className={`px-4 py-2 rounded ${
                selectedGameweek === 0 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
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
              key={gw.id}
              onClick={() => setSelectedGameweek(gw.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                gw.id === selectedGameweek
                  ? 'bg-blue-600 text-white'
                  : gw.is_current
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : gw.finished
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              GW{gw.id}
              {gw.is_current && (
                <span className="ml-1 text-xs">(Current)</span>
              )}
              {gw.finished && (
                <span className="ml-1 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fixtures Display */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <p className="text-lg font-semibold">{fixture.home_team_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {fixture.home_team_short}
                      </p>
                    </div>
                    
                    <div className="mx-8 text-center min-w-[120px]">
                      {fixture.finished ? (
                        <div>
                          <div className="text-2xl font-bold">
                            {fixture.team_h_score} - {fixture.team_a_score}
                          </div>
                          {getStatusBadge(fixture)}
                        </div>
                      ) : fixture.started ? (
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {fixture.team_h_score || 0} - {fixture.team_a_score || 0}
                          </div>
                          {getStatusBadge(fixture)}
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600">{formatTime(fixture.kickoff_time)}</p>
                          <p className="text-sm text-gray-500">{formatDate(fixture.kickoff_time)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{fixture.away_team_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {fixture.away_team_short}
                      </p>
                    </div>
                  </div>

                  {/* Difficulty Indicators */}
                  <div className="flex justify-between mt-4">
                    <div className="flex-1 text-right">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${fixture.home_difficulty_color}`}>
                        {fixture.home_difficulty}
                      </span>
                    </div>
                    <div className="mx-8"></div>
                    <div className="flex-1">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${fixture.away_difficulty_color}`}>
                        {fixture.away_difficulty}
                      </span>
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
              const dayFixtures = fixtures.filter(f => {
                const date = new Date(f.kickoff_time);
                return date.getDay() === ((i + 1) % 7);
              });
              
              return (
                <div key={i} className="border rounded-lg p-2 min-h-[150px]">
                  {dayFixtures.map((match) => (
                    <div key={match.id} className="text-xs mb-2 p-2 bg-gray-50 rounded">
                      <p className="font-semibold">{formatTime(match.kickoff_time)}</p>
                      <p className="truncate">
                        {match.home_team_short} v {match.away_team_short}
                      </p>
                      {match.finished && (
                        <p className="text-gray-600 font-semibold">
                          {match.team_h_score}-{match.team_a_score}
                        </p>
                      )}
                      {match.started && !match.finished && (
                        <p className="text-red-600 font-semibold animate-pulse">
                          LIVE
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Fixtures Summary */}
      {fixtures.some(f => f.started && !f.finished) && (
        <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></span>
            Live Matches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixtures
              .filter(f => f.started && !f.finished)
              .map(fixture => (
                <div key={fixture.id} className="bg-white rounded p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{fixture.home_team_short}</span>
                    <span className="text-xl font-bold text-red-600">
                      {fixture.team_h_score || 0} - {fixture.team_a_score || 0}
                    </span>
                    <span className="font-semibold">{fixture.away_team_short}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
