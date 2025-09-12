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
    
    // Get live data for a specific player
    if (blockchainId) {
      const stats = await playerMappingService.getLiveStats(
        BigInt(blockchainId),
        gameweekNum
      );
      
      if (!stats) {
        return NextResponse.json(
          { error: 'No live data found for this player' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(stats);
    }

    // Get all live data for the gameweek
    const liveData = await fplService.getLiveGameweekData(gameweekNum);
    const mappings = await playerMappingService.getAllMappings();
    
    // Transform live data to include blockchain IDs
    const enhancedLiveData = await Promise.all(
      mappings.map(async (mapping) => {
        const fplStats = liveData.elements[mapping.fplId.toString()];
        
        return {
          blockchainId: mapping.blockchainId.toString(),
          fplId: mapping.fplId,
          name: mapping.name,
          team: mapping.team,
          position: mapping.position,
          stats: fplStats?.stats || null
        };
      })
    );

    // Filter out players without stats
    const activeData = enhancedLiveData.filter(player => player.stats !== null);

    return NextResponse.json({
      gameweek: gameweekNum,
      playersWithStats: activeData.length,
      totalPlayers: mappings.length,
      data: enhancedLiveData
    });
  } catch (error) {
    console.error('Error fetching live data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live data' },
      { status: 500 }
    );
  }
}
