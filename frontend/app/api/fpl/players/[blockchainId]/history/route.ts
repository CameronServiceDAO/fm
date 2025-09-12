import { NextResponse } from 'next/server';
import { playerMappingService } from '@/lib/services/playerMappingService';
import { fplService } from '@/lib/services/fplService';

export async function GET(
  request: Request,
  { params }: { params: { blockchainId: string } }
) {
  try {
    // Parse blockchain ID from URL parameter
    const blockchainId = BigInt(params.blockchainId);
    
    // Get FPL player ID from blockchain ID
    const fplId = await playerMappingService.getFplId(blockchainId);
    
    if (!fplId) {
      return NextResponse.json(
        { error: 'Player mapping not found' },
        { status: 404 }
      );
    }
    
    // Get player history from FPL
    const history = await playerMappingService.getPlayerHistory(blockchainId);
    
    if (!history || history.length === 0) {
      return NextResponse.json(
        { 
          blockchainId: blockchainId.toString(),
          fplId,
          history: [],
          message: 'No history available for this player'
        }
      );
    }
    
    // Get player details for context
    const playerMapping = await playerMappingService.getPlayerMapping(blockchainId);
    const fplPlayer = await fplService.getPlayer(fplId);
    
    // Format response with metadata
    const response = {
      blockchainId: blockchainId.toString(),
      fplId,
      name: playerMapping?.name || 'Unknown',
      team: playerMapping?.team || 'Unknown',
      position: playerMapping?.position || 'Unknown',
      currentSeason: {
        totalPoints: fplPlayer?.total_points || 0,
        form: fplPlayer?.form || '0.0',
        selectedBy: fplPlayer?.selected_by_percent || '0.0',
        nowCost: fplPlayer?.now_cost || 0,
      },
      history: history.map((game: any) => ({
        gameweek: game.round,
        opponent: game.opponent_team,
        wasHome: game.was_home,
        kickoffTime: game.kickoff_time,
        minutes: game.minutes,
        totalPoints: game.total_points,
        goals: game.goals_scored,
        assists: game.assists,
        cleanSheet: game.clean_sheets,
        goalsAgainst: game.goals_conceded,
        ownGoals: game.own_goals,
        penaltiesSaved: game.penalties_saved,
        penaltiesMissed: game.penalties_missed,
        yellowCards: game.yellow_cards,
        redCards: game.red_cards,
        saves: game.saves,
        bonus: game.bonus,
        bps: game.bps,
        influence: game.influence,
        creativity: game.creativity,
        threat: game.threat,
        ictIndex: game.ict_index,
        value: game.value,
        selected: game.selected,
      })),
      statistics: {
        gamesPlayed: history.length,
        totalMinutes: history.reduce((sum: number, g: any) => sum + g.minutes, 0),
        totalGoals: history.reduce((sum: number, g: any) => sum + g.goals_scored, 0),
        totalAssists: history.reduce((sum: number, g: any) => sum + g.assists, 0),
        totalPoints: history.reduce((sum: number, g: any) => sum + g.total_points, 0),
        averagePoints: history.length > 0 
          ? (history.reduce((sum: number, g: any) => sum + g.total_points, 0) / history.length).toFixed(1)
          : '0.0',
        cleanSheets: history.reduce((sum: number, g: any) => sum + g.clean_sheets, 0),
        totalBonus: history.reduce((sum: number, g: any) => sum + g.bonus, 0),
        totalYellowCards: history.reduce((sum: number, g: any) => sum + g.yellow_cards, 0),
        totalRedCards: history.reduce((sum: number, g: any) => sum + g.red_cards, 0),
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player history:', error);
    
    // Handle invalid blockchain ID
    if (error instanceof Error && error.message.includes('BigInt')) {
      return NextResponse.json(
        { error: 'Invalid blockchain ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch player history' },
      { status: 500 }
    );
  }
}
