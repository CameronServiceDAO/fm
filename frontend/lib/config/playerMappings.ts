/**
 * Player Mapping Configuration
 * Maps blockchain player IDs to FPL player IDs
 * 
 * To add new players:
 * 1. Find the FPL player ID from https://fantasy.premierleague.com/api/bootstrap-static/
 * 2. Assign a unique blockchain ID (incrementing from the last one)
 * 3. Add the mapping below
 */

export interface PlayerMappingConfig {
  blockchainId: number;
  fplId: number;
  name: string;
  team: string;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
}

// Top Premier League players mapped to blockchain IDs
export const PLAYER_MAPPINGS: PlayerMappingConfig[] = [
  // Forwards
  { blockchainId: 1, fplId: 318, name: "Haaland", team: "Man City", position: "FWD" },
  { blockchainId: 2, fplId: 277, name: "Salah", team: "Liverpool", position: "MID" },
  { blockchainId: 3, fplId: 337, name: "Palmer", team: "Chelsea", position: "MID" },
  { blockchainId: 4, fplId: 19, name: "Saka", team: "Arsenal", position: "MID" },
  { blockchainId: 5, fplId: 311, name: "Son", team: "Spurs", position: "MID" },
  
  // Midfielders
  { blockchainId: 6, fplId: 355, name: "Fernandes", team: "Man Utd", position: "MID" },
  { blockchainId: 7, fplId: 18, name: "Ødegaard", team: "Arsenal", position: "MID" },
  { blockchainId: 8, fplId: 308, name: "Maddison", team: "Spurs", position: "MID" },
  { blockchainId: 9, fplId: 328, name: "Foden", team: "Man City", position: "MID" },
  { blockchainId: 10, fplId: 194, name: "Martinelli", team: "Arsenal", position: "MID" },
  
  // Defenders
  { blockchainId: 11, fplId: 283, name: "Alexander-Arnold", team: "Liverpool", position: "DEF" },
  { blockchainId: 12, fplId: 359, name: "Saliba", team: "Arsenal", position: "DEF" },
  { blockchainId: 13, fplId: 17, name: "Gabriel", team: "Arsenal", position: "DEF" },
  { blockchainId: 14, fplId: 278, name: "Van Dijk", team: "Liverpool", position: "DEF" },
  { blockchainId: 15, fplId: 320, name: "Dias", team: "Man City", position: "DEF" },
  
  // More top players
  { blockchainId: 16, fplId: 427, name: "Watkins", team: "Aston Villa", position: "FWD" },
  { blockchainId: 17, fplId: 395, name: "Isak", team: "Newcastle", position: "FWD" },
  { blockchainId: 18, fplId: 351, name: "Rashford", team: "Man Utd", position: "MID" },
  { blockchainId: 19, fplId: 343, name: "Jackson", team: "Chelsea", position: "FWD" },
  { blockchainId: 20, fplId: 21, name: "Havertz", team: "Arsenal", position: "MID" },
  
  // Goalkeepers
  { blockchainId: 21, fplId: 279, name: "Alisson", team: "Liverpool", position: "GKP" },
  { blockchainId: 22, fplId: 325, name: "Ederson", team: "Man City", position: "GKP" },
  { blockchainId: 23, fplId: 20, name: "Raya", team: "Arsenal", position: "GKP" },
  { blockchainId: 24, fplId: 389, name: "Pickford", team: "Everton", position: "GKP" },
  { blockchainId: 25, fplId: 438, name: "Martinez", team: "Aston Villa", position: "GKP" },
  
  // More players (extend as needed)
  { blockchainId: 26, fplId: 331, name: "De Bruyne", team: "Man City", position: "MID" },
  { blockchainId: 27, fplId: 306, name: "Kane", team: "Bayern", position: "FWD" }, // Note: Update if still in FPL
  { blockchainId: 28, fplId: 367, name: "Darwin", team: "Liverpool", position: "FWD" },
  { blockchainId: 29, fplId: 356, name: "Garnacho", team: "Man Utd", position: "MID" },
  { blockchainId: 30, fplId: 430, name: "McGinn", team: "Aston Villa", position: "MID" },
  
  // Add more mappings as needed...
];

// Helper function to get mapping by blockchain ID
export function getMappingByBlockchainId(blockchainId: number): PlayerMappingConfig | undefined {
  return PLAYER_MAPPINGS.find(m => m.blockchainId === blockchainId);
}

// Helper function to get mapping by FPL ID
export function getMappingByFplId(fplId: number): PlayerMappingConfig | undefined {
  return PLAYER_MAPPINGS.find(m => m.fplId === fplId);
}

// Get all blockchain IDs
export function getAllBlockchainIds(): number[] {
  return PLAYER_MAPPINGS.map(m => m.blockchainId);
}

// Get all FPL IDs
export function getAllFplIds(): number[] {
  return PLAYER_MAPPINGS.map(m => m.fplId);
}
