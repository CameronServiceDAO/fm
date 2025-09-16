'use client';

import { useState, useEffect } from 'react';
import { fplService } from '@/lib/services/fplService';

export default function TestAPIPage() {
  const [apiStatus, setApiStatus] = useState<{
    bootstrap: 'loading' | 'success' | 'error';
    players: 'loading' | 'success' | 'error';
    fixtures: 'loading' | 'success' | 'error';
    gameweek: 'loading' | 'success' | 'error';
  }>({
    bootstrap: 'loading',
    players: 'loading',
    fixtures: 'loading',
    gameweek: 'loading',
  });
  
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const testAPIs = async () => {
      // Test bootstrap data
      try {
        const bootstrap = await fplService.getBootstrapData();
        setApiStatus(prev => ({ ...prev, bootstrap: 'success' }));
        setData(prev => ({ ...prev, bootstrap: { 
          playersCount: bootstrap.elements?.length,
          teamsCount: bootstrap.teams?.length,
          gameweeksCount: bootstrap.events?.length
        }}));
      } catch (error) {
        setApiStatus(prev => ({ ...prev, bootstrap: 'error' }));
        console.error('Bootstrap API failed:', error);
      }

      // Test players API
      try {
        const response = await fetch('/api/fpl/players');
        const players = await response.json();
        setApiStatus(prev => ({ ...prev, players: 'success' }));
        setData(prev => ({ ...prev, players: { 
          count: Array.isArray(players) ? players.length : 0,
          sample: Array.isArray(players) ? players.slice(0, 3).map(p => p.name) : []
        }}));
      } catch (error) {
        setApiStatus(prev => ({ ...prev, players: 'error' }));
        console.error('Players API failed:', error);
      }

      // Test fixtures API
      try {
        const response = await fetch('/api/fpl/fixtures');
        const fixtures = await response.json();
        setApiStatus(prev => ({ ...prev, fixtures: 'success' }));
        setData(prev => ({ ...prev, fixtures: { 
          count: Array.isArray(fixtures) ? fixtures.length : 0
        }}));
      } catch (error) {
        setApiStatus(prev => ({ ...prev, fixtures: 'error' }));
        console.error('Fixtures API failed:', error);
      }

      // Test gameweek API
      try {
        const response = await fetch('/api/fpl/gameweek?current=true');
        const gameweek = await response.json();
        setApiStatus(prev => ({ ...prev, gameweek: 'success' }));
        setData(prev => ({ ...prev, gameweek: { 
          current: gameweek.id,
          name: gameweek.name
        }}));
      } catch (error) {
        setApiStatus(prev => ({ ...prev, gameweek: 'error' }));
        console.error('Gameweek API failed:', error);
      }
    };

    testAPIs();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">API Test Dashboard</h1>
      
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoints Status</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>FPL Bootstrap Data:</span>
              <span className={`font-semibold ${getStatusColor(apiStatus.bootstrap)}`}>
                {apiStatus.bootstrap.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Players API (/api/fpl/players):</span>
              <span className={`font-semibold ${getStatusColor(apiStatus.players)}`}>
                {apiStatus.players.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Fixtures API (/api/fpl/fixtures):</span>
              <span className={`font-semibold ${getStatusColor(apiStatus.fixtures)}`}>
                {apiStatus.fixtures.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Gameweek API (/api/fpl/gameweek):</span>
              <span className={`font-semibold ${getStatusColor(apiStatus.gameweek)}`}>
                {apiStatus.gameweek.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Data Retrieved</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}