import { NextResponse } from 'next/server';
import { fplService } from '@/lib/services/fplService';
import { playerMappingService } from '@/lib/services/playerMappingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get('gameweek');
    const blockchainId = searchParams.get('blockchainId');
    
    if (!gameweek) {
      return NextResponse.json(
        { error: 'Gameweek parameter is required' },
        { status: 400 }
      );
    }

    const gameweekNum = parseInt(gameweek);
    
    // Get live data for the gameweek
    const liveData = await fplService.getLiveGameweekData(gameweekNum);
    
    if (!liveData || !liveData.elements) {
      return NextResponse.json(
        { error: 'No live data available for this gameweek' },
        { status: 404 }
      );
    }

    // If specific player requested
    if (blockchainId) {
      const mapping = await playerMappingService.getPlayerMapping(BigInt(blockchainId));
      
      if (!mapping) {
        return NextResponse.json(
          { error: 'Player mapping not found' },
          { status: 404 }
        );
      }

      const playerLiveData = liveData.elements[mapping.fplId.toString()];
      
      if (!playerLiveData) {
        return NextResponse.json({
          blockchainId: blockchainId,
          fplId: mapping.fplId,
          name: mapping.name,
          team: mapping.team,
          position: mapping.position,
          gameweek: gameweekNum,
          stats: null,
          message: 'No live data for this player in this gameweek'
        });
      }

      // Get FPL player data for additional context
      const fplPlayer = await fplService.getPlayer(mapping.fplId);
      const teams = await fplService.getTeams();
      const team = teams.find(t => t.id === fplPlayer?.team);

      return NextResponse.json({
        blockchainId: blockchainId,
        fplId: mapping.fplId,
        name: mapping.name,
        team: team?.name || mapping.team,
        position: mapping.position,
        gameweek: gameweekNum,
        stats: playerLiveData.stats,
        explain: playerLiveData.explain || null, // Bonus points explanation if available
      });
    }

    // Get all mapped players' live data
    const mappings = await playerMappingService.getAllMappings();
    const teams = await fplService.getTeams();
    const players = await fplService.getPlayers();
    
    const livePlayerStats = mappings.map(mapping => {
      const playerLiveData = liveData.elements[mapping.fplId.toString()];
      const fplPlayer = players.find(p => p.id === mapping.fplId);
      const team = teams.find(t => t.id === fplPlayer?.team);
      
      return {
        blockchainId: mapping.blockchainId.toString(),
        fplId: mapping.fplId,
        name: mapping.name,
        team: team?.name || mapping.team,
        position: mapping.position,
        gameweek: gameweekNum,
        stats: playerLiveData?.stats || null,
        explain: playerLiveData?.explain || null,
      };
    });

    // Filter to only players with stats (who played)
    const activePlayers = livePlayerStats.filter(p => p.stats !== null);
    const benchedPlayers = livePlayerStats.filter(p => p.stats === null);

    // Calculate summary statistics
    const summary = {
      gameweek: gameweekNum,
      totalPlayers: livePlayerStats.length,
      activePlayers: activePlayers.length,
      benchedPlayers: benchedPlayers.length,
      totalPoints: activePlayers.reduce((sum, p) => sum + (p.stats?.total_points || 0), 0),
      totalGoals: activePlayers.reduce((sum, p) => sum + (p.stats?.goals_scored || 0), 0),
      totalAssists: activePlayers.reduce((sum, p) => sum + (p.stats?.assists || 0), 0),
      totalCleanSheets: activePlayers.reduce((sum, p) => sum + (p.stats?.clean_sheets || 0), 0),
      topScorer: activePlayers.sort((a, b) => (b.stats?.total_points || 0) - (a.stats?.total_points || 0))[0] || null,
    };

    return NextResponse.json({
      summary,
      players: livePlayerStats,
      active: activePlayers,
      benched: benchedPlayers,
    });
  } catch (error) {
    console.error('Error fetching live data:', error);
    
    // Handle invalid gameweek
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Gameweek not found or not yet started' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch live data' },
      { status: 500 }
    );
  }
}
