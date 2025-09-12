import { fplService } from './fplService';
import { playerMappingService } from './playerMappingService';
import { ethers } from 'ethers';
import GameweekPointsStoreABI from '../abis/GameweekPointsStore.json';
import { CONTRACT_ADDRESSES } from '../contracts/config';

export interface PointsUpdate {
  gameweek: number;
  playerId: bigint;
  points: number;
}

export interface SyncStatus {
  gameweek: number;
  syncedAt: Date | null;
  playersSynced: number;
  totalPlayers: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

class PointsSyncService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private syncStatus: Map<number, SyncStatus> = new Map();

  // Initialize with provider and signer
  async initialize(provider: ethers.JsonRpcProvider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.gameweekPointsStore,
      GameweekPointsStoreABI,
      signer
    );
  }

  // Get points for a specific gameweek from FPL
  async getFPLPointsForGameweek(gameweek: number): Promise<PointsUpdate[]> {
    const liveData = await fplService.getLiveGameweekData(gameweek);
    const mappings = await playerMappingService.getAllMappings();
    
    const pointsUpdates: PointsUpdate[] = [];
    
    for (const mapping of mappings) {
      const fplData = liveData.elements[mapping.fplId.toString()];
      if (fplData && fplData.stats) {
        pointsUpdates.push({
          gameweek,
          playerId: mapping.blockchainId,
          points: fplData.stats.total_points
        });
      }
    }
    
    return pointsUpdates;
  }

  // Check if points are already synced on-chain
  async arePointsSynced(gameweek: number, playerId: bigint): Promise<boolean> {
    if (!this.contract) throw new Error('Service not initialized');
    
    try {
      const points = await this.contract.getPoints(gameweek, playerId);
      return points > 0;
    } catch (error) {
      console.error('Error checking synced points:', error);
      return false;
    }
  }

  // Sync points for a single player
  async syncPlayerPoints(gameweek: number, playerId: bigint, points: number): Promise<boolean> {
    if (!this.contract) throw new Error('Service not initialized');
    
    try {
      // Check if already synced
      const isSynced = await this.arePointsSynced(gameweek, playerId);
      if (isSynced) {
        console.log(`Points already synced for player ${playerId} in GW${gameweek}`);
        return true;
      }

      // Send transaction
      const tx = await this.contract.setPoints(gameweek, playerId, points);
      await tx.wait();
      
      console.log(`Synced ${points} points for player ${playerId} in GW${gameweek}`);
      return true;
    } catch (error) {
      console.error(`Failed to sync points for player ${playerId}:`, error);
      return false;
    }
  }

  // Batch sync points for multiple players
  async batchSyncPoints(gameweek: number, updates: PointsUpdate[]): Promise<boolean> {
    if (!this.contract) throw new Error('Service not initialized');
    
    try {
      const playerIds = updates.map(u => u.playerId);
      const points = updates.map(u => u.points);
      
      // Check gas estimate
      const gasEstimate = await this.contract.setPointsBatch.estimateGas(
        gameweek,
        playerIds,
        points
      );
      
      console.log(`Estimated gas for batch sync: ${gasEstimate.toString()}`);
      
      // Send transaction with gas buffer
      const tx = await this.contract.setPointsBatch(
        gameweek,
        playerIds,
        points,
        { gasLimit: gasEstimate * 120n / 100n } // 20% buffer
      );
      
      await tx.wait();
      console.log(`Batch synced ${updates.length} players for GW${gameweek}`);
      return true;
    } catch (error) {
      console.error('Batch sync failed:', error);
      return false;
    }
  }

  // Sync all points for a gameweek
  async syncGameweek(gameweek: number): Promise<SyncStatus> {
    const status: SyncStatus = {
      gameweek,
      syncedAt: null,
      playersSynced: 0,
      totalPlayers: 0,
      status: 'syncing'
    };
    
    this.syncStatus.set(gameweek, status);
    
    try {
      // Get all points updates
      const updates = await this.getFPLPointsForGameweek(gameweek);
      status.totalPlayers = updates.length;
      
      if (updates.length === 0) {
        status.status = 'completed';
        status.syncedAt = new Date();
        return status;
      }
      
      // Filter out already synced players
      const unsyncedUpdates: PointsUpdate[] = [];
      for (const update of updates) {
        const isSynced = await this.arePointsSynced(update.gameweek, update.playerId);
        if (!isSynced) {
          unsyncedUpdates.push(update);
        } else {
          status.playersSynced++;
        }
      }
      
      if (unsyncedUpdates.length === 0) {
        status.status = 'completed';
        status.syncedAt = new Date();
        return status;
      }
      
      // Batch sync in chunks to avoid gas limits
      const BATCH_SIZE = 10;
      for (let i = 0; i < unsyncedUpdates.length; i += BATCH_SIZE) {
        const batch = unsyncedUpdates.slice(i, i + BATCH_SIZE);
        const success = await this.batchSyncPoints(gameweek, batch);
        
        if (success) {
          status.playersSynced += batch.length;
        } else {
          status.status = 'failed';
          status.error = 'Batch sync failed';
          return status;
        }
      }
      
      status.status = 'completed';
      status.syncedAt = new Date();
      return status;
    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      return status;
    }
  }

  // Get sync status for a gameweek
  getSyncStatus(gameweek: number): SyncStatus | null {
    return this.syncStatus.get(gameweek) || null;
  }

  // Get all sync statuses
  getAllSyncStatuses(): SyncStatus[] {
    return Array.from(this.syncStatus.values());
  }

  // Check which gameweeks need syncing
  async getUnsyncedGameweeks(): Promise<number[]> {
    const currentGameweek = await fplService.getCurrentGameweek();
    if (!currentGameweek) return [];
    
    const unsyncedGameweeks: number[] = [];
    
    // Check all completed gameweeks
    for (let gw = 1; gw < currentGameweek.id; gw++) {
      const status = this.getSyncStatus(gw);
      if (!status || status.status !== 'completed') {
        unsyncedGameweeks.push(gw);
      }
    }
    
    return unsyncedGameweeks;
  }
}

export const pointsSyncService = new PointsSyncService();
