
import useSWR from 'swr';
import { FPLPlayer, FPLFixture, FPLGameweek } from '@/lib/services/fplService';
import { PlayerMapping } from '@/lib/services/playerMappingService';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface EnhancedPlayer extends PlayerMapping {
  fplData: FPLPlayer;
}

export interface EnhancedFixture extends FPLFixture {
  home_team_name: string;
  away_team_name: string;
  home_team_short: string;
  away_team_short: string;
  home_difficulty: string;
  away_difficulty: string;
  home_difficulty_color: string;
  away_difficulty_color: string;
}

export interface LivePlayerStats {
  blockchainId: string;
  fplId: number;
  name: string;
  team: string;
  position: string;
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
  } | null;
}

// Hook to get FPL player data by blockchain ID
export function useFPLPlayer(blockchainId: bigint | null) {
  const { data, error, isLoading, mutate } = useSWR<EnhancedPlayer>(
    blockchainId ? `/api/fpl/players?blockchainId=${blockchainId}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
    }
  );

  return {
    player: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to get all FPL players
export function useFPLPlayers() {
  const { data, error, isLoading, mutate } = useSWR<EnhancedPlayer[]>(
    '/api/fpl/players',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    players: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to search FPL players
export function useFPLPlayerSearch(query: string) {
  const { data, error, isLoading } = useSWR<PlayerMapping[]>(
    query ? `/api/fpl/players?search=${encodeURIComponent(query)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    results: data || [],
    isLoading,
    isError: error,
  };
}

// Hook to get current gameweek
export function useFPLCurrentGameweek() {
  const { data, error, isLoading, mutate } = useSWR<FPLGameweek>(
    '/api/fpl/gameweek?current=true',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    gameweek: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to get all gameweeks
export function useFPLGameweeks() {
  const { data, error, isLoading } = useSWR<FPLGameweek[]>(
    '/api/fpl/gameweek',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    gameweeks: data || [],
    isLoading,
    isError: error,
  };
}

// Hook to get fixtures for a gameweek
export function useFPLFixtures(gameweek?: number) {
  const { data, error, isLoading, mutate } = useSWR<EnhancedFixture[]>(
    `/api/fpl/fixtures${gameweek ? `?gameweek=${gameweek}` : ''}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
    }
  );

  return {
    fixtures: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to get team fixtures
export function useFPLTeamFixtures(teamId: number) {
  const { data, error, isLoading } = useSWR<EnhancedFixture[]>(
    `/api/fpl/fixtures?team=${teamId}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    fixtures: data || [],
    isLoading,
    isError: error,
  };
}

// Hook to get live gameweek data
export function useFPLLiveData(gameweek: number | null) {
  const { data, error, isLoading, mutate } = useSWR<LivePlayerStats[]>(
    gameweek ? `/api/fpl/live?gameweek=${gameweek}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds during live games
      revalidateOnFocus: true,
    }
  );

  return {
    liveData: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to get live stats for a specific player
export function useFPLPlayerLiveStats(blockchainId: bigint | null, gameweek: number | null) {
  const { data, error, isLoading, mutate } = useSWR<any>(
    blockchainId && gameweek 
      ? `/api/fpl/live?gameweek=${gameweek}&blockchainId=${blockchainId}`
      : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to get player history
export function useFPLPlayerHistory(blockchainId: bigint | null) {
  const { data, error, isLoading } = useSWR<any[]>(
    blockchainId ? `/api/fpl/players/${blockchainId}/history` : null,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    history: data || [],
    isLoading,
    isError: error,
  };
}
