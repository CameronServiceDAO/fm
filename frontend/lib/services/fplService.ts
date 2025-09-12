
import axios from 'axios';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

export interface FPLPlayer {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  team_code: number;
  element_type: number; // 1: GKP, 2: DEF, 3: MID, 4: FWD
  now_cost: number; // Price in tenths (e.g., 50 = £5.0m)
  total_points: number;
  points_per_game: string;
  selected_by_percent: string;
  form: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  transfers_in: number;
  transfers_out: number;
  transfers_in_event: number;
  transfers_out_event: number;
  event_points: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
}

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface FPLFixture {
  id: number;
  event: number; // Gameweek number
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  started: boolean;
  finished: boolean;
  kickoff_time: string;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export interface FPLGameweek {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  highest_score: number;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  most_selected: number;
  most_transferred_in: number;
  most_captained: number;
  most_vice_captained: number;
}

export interface FPLLiveData {
  elements: {
    [key: string]: {
      stats: {
        minutes: number;
        goals_scored: number;
        assists: number;
        clean_sheets: number;
        goals_conceded: number;
        own_goals: number;
        penalties_saved: number;
        penalties_missed: number;
        yellow_cards: number;
        red_cards: number;
        saves: number;
        bonus: number;
        bps: number;
        total_points: number;
      };
    };
  };
}

export interface FPLPlayerHistory {
  element: number;
  fixture: number;
  total_points: number;
  round: number;
  kickoff_time: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  value: number;
  selected: number;
}

class FPLService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchWithCache(key: string, fetcher: () => Promise<any>) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getBootstrapData() {
    return this.fetchWithCache('bootstrap', async () => {
      const response = await axios.get(`${FPL_BASE_URL}/bootstrap-static/`);
      return response.data;
    });
  }

  async getPlayers(): Promise<FPLPlayer[]> {
    const data = await this.getBootstrapData();
    return data.elements;
  }

  async getTeams(): Promise<FPLTeam[]> {
    const data = await this.getBootstrapData();
    return data.teams;
  }

  async getGameweeks(): Promise<FPLGameweek[]> {
    const data = await this.getBootstrapData();
    return data.events;
  }

  async getCurrentGameweek(): Promise<FPLGameweek | null> {
    const gameweeks = await this.getGameweeks();
    return gameweeks.find(gw => gw.is_current) || null;
  }

  async getPlayer(playerId: number): Promise<FPLPlayer | null> {
    const players = await this.getPlayers();
    return players.find(p => p.id === playerId) || null;
  }

  async getPlayerHistory(playerId: number): Promise<FPLPlayerHistory[]> {
    return this.fetchWithCache(`player-history-${playerId}`, async () => {
      const response = await axios.get(`${FPL_BASE_URL}/element-summary/${playerId}/`);
      return response.data.history;
    });
  }

  async getFixtures(gameweek?: number): Promise<FPLFixture[]> {
    return this.fetchWithCache(`fixtures-${gameweek || 'all'}`, async () => {
      const url = gameweek 
        ? `${FPL_BASE_URL}/fixtures/?event=${gameweek}`
        : `${FPL_BASE_URL}/fixtures/`;
      const response = await axios.get(url);
      return response.data;
    });
  }

  async getLiveGameweekData(gameweek: number): Promise<FPLLiveData> {
    return this.fetchWithCache(`live-${gameweek}`, async () => {
      const response = await axios.get(`${FPL_BASE_URL}/event/${gameweek}/live/`);
      return response.data;
    });
  }

  // Helper methods for position mapping
  getPositionName(elementType: number): string {
    const positions: { [key: number]: string } = {
      1: 'Goalkeeper',
      2: 'Defender',
      3: 'Midfielder',
      4: 'Forward'
    };
    return positions[elementType] || 'Unknown';
  }

  getPositionShort(elementType: number): string {
    const positions: { [key: number]: string } = {
      1: 'GKP',
      2: 'DEF',
      3: 'MID',
      4: 'FWD'
    };
    return positions[elementType] || 'UNK';
  }

  // Convert FPL price (in tenths) to actual price
  formatPrice(price: number): string {
    return `£${(price / 10).toFixed(1)}m`;
  }

  // Calculate ownership percentage
  formatOwnership(percent: string): string {
    return `${parseFloat(percent).toFixed(1)}%`;
  }

  // Get team name by ID
  async getTeamName(teamId: number): Promise<string> {
    const teams = await this.getTeams();
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown';
  }

  // Get difficulty rating
  getDifficultyRating(difficulty: number): string {
    const ratings: { [key: number]: string } = {
      1: 'Very Easy',
      2: 'Easy',
      3: 'Medium',
      4: 'Hard',
      5: 'Very Hard'
    };
    return ratings[difficulty] || 'Unknown';
  }

  // Get fixture difficulty color
  getDifficultyColor(difficulty: number): string {
    const colors: { [key: number]: string } = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-green-50 text-green-700',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  }
}

export const fplService = new FPLService();
