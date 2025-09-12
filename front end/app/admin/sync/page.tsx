'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import GameweekPointsStoreABI from '@/lib/abis/GameweekPointsStore.json';
import { useFPLCurrentGameweek, useFPLGameweeks } from '@/lib/hooks/useFPLData';
import { playerMappingService } from '@/lib/services/playerMappingService';
import { fplService } from '@/lib/services/fplService';
import toast from 'react-hot-toast';

interface SyncStatus {
  gameweek: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  playersSynced: number;
  totalPlayers: number;
  error?: string;
}

export default function AdminSyncPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { gameweek: currentGameweek } = useFPLCurrentGameweek();
  const { gameweeks } = useFPLGameweeks();
  
  const [syncStatuses, setSyncStatuses] = useState<Map<number, SyncStatus>>(new Map());
  const [selectedGameweek, setSelectedGameweek] = useState<number>(0);
  const [isOwner, setIsOwner] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  // Check if user is contract owner (simplified - in production check on-chain)
  useEffect(() => {
    if (address) {
      // In production, check if address matches contract owner
      // For now, just check against a hardcoded admin address
      const ADMIN_ADDRESSES = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // Example admin
      ];
      setIsOwner(ADMIN_ADDRESSES.includes(address));
    }
  }, [address]);

  // Auto-sync handler
  useEffect(() => {
    if (autoSync && currentGameweek) {
      const interval = setInterval(() => {
        checkAndSyncGameweek(currentGameweek.id - 1);
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [autoSync, currentGameweek]);

  const fetchGameweekPoints = async (gameweek: number) => {
    try {
      const liveData = await fplService.getLiveGameweekData(gameweek);
      const mappings = await playerMappingService.getAllMappings();
      
      const pointsData: { playerId: bigint; points: number }[] = [];
      
      for (const mapping of mappings) {
        const fplData = liveData.elements[mapping.fplId.toString()];
        if (fplData?.stats) {
          pointsData.push({
            playerId: mapping.blockchainId,
            points: fplData.stats.total_points
          });
        }
      }
      
      return pointsData;
    } catch (error) {
      console.error('Error fetching gameweek points:', error);
      throw error;
    }
  };

  const syncGameweekPoints = async (gameweek: number) => {
    const status: SyncStatus = {
      gameweek,
      status: 'syncing',
      playersSynced: 0,
      totalPlayers: 0
    };
    
    setSyncStatuses(prev => new Map(prev).set(gameweek, status));
    
    try {
      // Fetch points from FPL
      const pointsData = await fetchGameweekPoints(gameweek);
      status.totalPlayers = pointsData.length;
      
      if (pointsData.length === 0) {
        status.status = 'completed';
        setSyncStatuses(prev => new Map(prev).set(gameweek, status));
        toast.success(`No players to sync for GW${gameweek}`);
        return;
      }
      
      // Batch sync in chunks
      const BATCH_SIZE = 10;
      for (let i = 0; i < pointsData.length; i += BATCH_SIZE) {
        const batch = pointsData.slice(i, i + BATCH_SIZE);
        const playerIds = batch.map(p => p.playerId);
        const points = batch.map(p => p.points);
        
        try {
          await writeContract({
            address: CONTRACT_ADDRESSES.gameweekPointsStore as `0x${string}`,
            abi: GameweekPointsStoreABI,
            functionName: 'setPointsBatch',
            args: [gameweek, playerIds, points],
          });
          
          status.playersSynced += batch.length;
          setSyncStatuses(prev => new Map(prev).set(gameweek, status));
        } catch (error) {
          console.error(`Batch sync failed for GW${gameweek}:`, error);
          status.status = 'failed';
          status.error = 'Batch sync failed';
          setSyncStatuses(prev => new Map(prev).set(gameweek, status));
          toast.error(`Failed to sync batch for GW${gameweek}`);
          return;
        }
      }
      
      status.status = 'completed';
      setSyncStatuses(prev => new Map(prev).set(gameweek, status));
      toast.success(`Successfully synced GW${gameweek}: ${status.playersSynced} players`);
    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      setSyncStatuses(prev => new Map(prev).set(gameweek, status));
      toast.error(`Failed to sync GW${gameweek}`);
    }
  };

  const checkAndSyncGameweek = async (gameweek: number) => {
    const gw = gameweeks.find(g => g.id === gameweek);
    if (gw?.finished && !syncStatuses.get(gameweek)?.status) {
      await syncGameweekPoints(gameweek);
    }
  };

  const seedDummyData = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.gameweekPointsStore as `0x${string}`,
        abi: GameweekPointsStoreABI,
        functionName: 'seedDummy3GW',
        args: [],
      });
      toast.success('Dummy data seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed dummy data');
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Admin - Points Sync</h1>
        <p className="text-gray-600">Please connect your wallet</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-red-600">You are not authorized to access this page</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin - Points Sync</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Auto-sync completed GWs</span>
          </label>
          <button
            onClick={seedDummyData}
            disabled={isPending}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
          >
            Seed Dummy Data
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Gameweek</p>
            <p className="text-2xl font-bold">GW{currentGameweek?.id || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed Gameweeks</p>
            <p className="text-2xl font-bold">
              {gameweeks.filter(gw => gw.finished).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Synced Gameweeks</p>
            <p className="text-2xl font-bold text-green-600">
              {Array.from(syncStatuses.values()).filter(s => s.status === 'completed').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Auto-sync</p>
            <p className="text-2xl font-bold">
              {autoSync ? '🟢 Active' : '🔴 Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Gameweek Sync Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Gameweek Points Sync</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Gameweek
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                FPL Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sync Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Players Synced
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {gameweeks.map((gw) => {
              const syncStatus = syncStatuses.get(gw.id);
              return (
                <tr key={gw.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">GW{gw.id}</span>
                    {gw.is_current && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      gw.finished 
                        ? 'bg-green-100 text-green-800' 
                        : gw.is_current 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {gw.finished ? 'Completed' : gw.is_current ? 'In Progress' : 'Upcoming'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {syncStatus ? (
                      <span className={`px-2 py-1 text-xs rounded ${
                        syncStatus.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : syncStatus.status === 'syncing'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : syncStatus.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {syncStatus.status === 'syncing' ? 'Syncing...' : syncStatus.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not synced</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {syncStatus ? (
                      <span>
                        {syncStatus.playersSynced} / {syncStatus.totalPlayers || '?'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {gw.finished && (
                      <button
                        onClick={() => syncGameweekPoints(gw.id)}
                        disabled={isPending || syncStatus?.status === 'syncing'}
                        className={`px-4 py-2 rounded text-sm font-semibold transition disabled:opacity-50 ${
                          syncStatus?.status === 'completed'
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {syncStatus?.status === 'completed' ? 'Re-sync' : 'Sync Points'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Error Display */}
      {Array.from(syncStatuses.values()).filter(s => s.status === 'failed').length > 0 && (
        <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Sync Errors</h3>
          {Array.from(syncStatuses.entries())
            .filter(([_, status]) => status.status === 'failed')
            .map(([gw, status]) => (
              <div key={gw} className="text-sm text-red-600">
                GW{gw}: {status.error || 'Unknown error'}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
