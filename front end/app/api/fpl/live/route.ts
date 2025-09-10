
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

    const liveData = await fplService.getLiveGameweekData(parseInt(gameweek));

    // Get live stats for specific blockchain player
    if (blockchainId) {
      const stats = await playerMappingService.getLiveStats(
        BigInt(blockchainId),
        parseInt(gameweek)
      );
      
      if (!stats) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      return NextResponse.json(stats);
    }

    // Get all live data with blockchain mappings
    const allMappings = await playerMappingService.getAllMappings();
    const liveStats = await Promise.all(
      allMappings.map(async (mapping) => {
        const fplId = mapping.fplId;
        const stats = liveData.elements[fplId.toString()];
        
        return {
          blockchainId: mapping.blockchainId.toString(),
          fplId: mapping.fplId,
          name: mapping.name,
          team: mapping.team,
          position: mapping.position,
          stats: stats?.stats || null,
        };
      })
    );

    return NextResponse.json(liveStats.filter(s => s.stats !== null));
  } catch (error) {
    console.error('Error fetching live data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live data' },
      { status: 500 }
    );
  }
}
