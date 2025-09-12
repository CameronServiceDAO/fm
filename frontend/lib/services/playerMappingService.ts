
import { fplService, FPLPlayer } from './fplService';
import { PLAYER_MAPPINGS, PlayerMappingConfig } from '../config/playerMappings';

export interface PlayerMapping {
  blockchainId: bigint;
  fplId: number;
  name: string;
  team: string;
  position: string;
}

class PlayerMappingService {
  private mappings: Map<string, PlayerMapping> = new Map();
  private fplToBlockchain: Map<number, bigint> = new Map();
  private blockchainToFpl: Map<string, number> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const players = await fplService.getPlayers();
      const teams = await fplService.getTeams();

      // Use configured mappings
      PLAYER_MAPPINGS.forEach((config: PlayerMappingConfig) => {
        const blockchainId = BigInt(config.blockchainId);
        
        // Find the actual FPL player data
        const fplPlayer = players.find(p => p.id === config.fplId);
        const team = fplPlayer ? teams.find(t => t.id === fplPlayer.team) : null;
        
        const mapping: PlayerMapping = {
          blockchainId,
          fplId: config.fplId,
          name: fplPlayer?.web_name || config.name,
          team: team?.name || config.team,
          position: fplPlayer ? fplService.getPositionShort(fplPlayer.element_type) : config.position,
        };

        this.mappings.set(`blockchain-${blockchainId}`, mapping);
        this.mappings.set(`fpl-${config.fplId}`, mapping);
        this.fplToBlockchain.set(config.fplId, blockchainId);
        this.blockchainToFpl.set(blockchainId.toString(), config.fplId);
      });

      this.initialized = true;
      console.log(`Initialized ${PLAYER_MAPPINGS.length} player mappings`);
    } catch (error) {
      console.error('Failed to initialize player mappings:', error);
      // Use fallback data from config if FPL API fails
      PLAYER_MAPPINGS.forEach((config: PlayerMappingConfig) => {
        const blockchainId = BigInt(config.blockchainId);
        
        const mapping: PlayerMapping = {
          blockchainId,
          fplId: config.fplId,
          name: config.name,
          team: config.team,
          position: config.position,
        };

        this.mappings.set(`blockchain-${blockchainId}`, mapping);
        this.mappings.set(`fpl-${config.fplId}`, mapping);
        this.fplToBlockchain.set(config.fplId, blockchainId);
        this.blockchainToFpl.set(blockchainId.toString(), config.fplId);
      });
      
      this.initialized = true;
      console.log('Using fallback player mappings from config');
    }
  }

  async getBlockchainId(fplId: number): Promise<bigint | null> {
    await this.initialize();
    return this.fplToBlockchain.get(fplId) || null;
  }

  async getFplId(blockchainId: bigint): Promise<number | null> {
    await this.initialize();
    return this.blockchainToFpl.get(blockchainId.toString()) || null;
  }

  async getPlayerMapping(id: bigint | number): Promise<PlayerMapping | null> {
    await this.initialize();
    
    if (typeof id === 'bigint') {
      return this.mappings.get(`blockchain-${id}`) || null;
    } else {
      return this.mappings.get(`fpl-${id}`) || null;
    }
  }

  async getAllMappings(): Promise<PlayerMapping[]> {
    await this.initialize();
    const uniqueMappings = new Map<string, PlayerMapping>();
    
    this.mappings.forEach((mapping) => {
      uniqueMappings.set(mapping.blockchainId.toString(), mapping);
    });
    
    return Array.from(uniqueMappings.values());
  }

  async searchPlayers(query: string): Promise<PlayerMapping[]> {
    await this.initialize();
    const mappings = await this.getAllMappings();
    
    const lowercaseQuery = query.toLowerCase();
    return mappings.filter(
      m => 
        m.name.toLowerCase().includes(lowercaseQuery) ||
        m.team.toLowerCase().includes(lowercaseQuery) ||
        m.position.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get FPL data for a blockchain player ID
  async getFplPlayerData(blockchainId: bigint): Promise<FPLPlayer | null> {
    const fplId = await this.getFplId(blockchainId);
    if (!fplId) return null;
    
    return fplService.getPlayer(fplId);
  }

  // Get live stats for a blockchain player ID
  async getLiveStats(blockchainId: bigint, gameweek: number) {
    const fplId = await this.getFplId(blockchainId);
    if (!fplId) return null;

    const liveData = await fplService.getLiveGameweekData(gameweek);
    const stats = liveData.elements[fplId.toString()];
    
    if (!stats) return null;

    const mapping = await this.getPlayerMapping(blockchainId);
    return {
      blockchainId: blockchainId.toString(),
      fplId,
      name: mapping?.name || 'Unknown',
      team: mapping?.team || 'Unknown',
      position: mapping?.position || 'UNK',
      stats: stats.stats
    };
  }

  // Get historical performance for a blockchain player ID
  async getPlayerHistory(blockchainId: bigint) {
    const fplId = await this.getFplId(blockchainId);
    if (!fplId) return null;

    return fplService.getPlayerHistory(fplId);
  }

  // Check if a blockchain ID is mapped
  async isMapped(blockchainId: bigint): Promise<boolean> {
    await this.initialize();
    return this.blockchainToFpl.has(blockchainId.toString());
  }

  // Get unmapped blockchain IDs from a list
  async getUnmappedIds(blockchainIds: bigint[]): Promise<bigint[]> {
    await this.initialize();
    return blockchainIds.filter(id => !this.blockchainToFpl.has(id.toString()));
  }
}

export const playerMappingService = new PlayerMappingService();
