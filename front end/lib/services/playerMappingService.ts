
import { fplService, FPLPlayer } from './fplService';

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

  // Initialize mappings - in production, this would come from a database
  async initialize() {
    if (this.initialized) return;

    const players = await fplService.getPlayers();
    const teams = await fplService.getTeams();

    // For now, we'll map the top 100 players by total points to blockchain IDs
    // In production, you'd have a proper mapping stored in a database
    const topPlayers = players
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 100);

    topPlayers.forEach((player, index) => {
      const blockchainId = BigInt(index + 1);
      const team = teams.find(t => t.id === player.team);
      
      const mapping: PlayerMapping = {
        blockchainId,
        fplId: player.id,
        name: player.web_name,
        team: team?.name || 'Unknown',
        position: fplService.getPositionShort(player.element_type),
      };

      this.mappings.set(`blockchain-${blockchainId}`, mapping);
      this.mappings.set(`fpl-${player.id}`, mapping);
      this.fplToBlockchain.set(player.id, blockchainId);
      this.blockchainToFpl.set(blockchainId.toString(), player.id);
    });

    this.initialized = true;
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
    return liveData.elements[fplId.toString()];
  }

  // Get historical performance for a blockchain player ID
  async getPlayerHistory(blockchainId: bigint) {
    const fplId = await this.getFplId(blockchainId);
    if (!fplId) return null;

    return fplService.getPlayerHistory(fplId);
  }
}

export const playerMappingService = new PlayerMappingService();
