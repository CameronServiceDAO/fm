import { NextResponse } from 'next/server';
import { playerMappingService } from '@/lib/services/playerMappingService';
import { fplService } from '@/lib/services/fplService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchainId = searchParams.get('blockchainId');
    const search = searchParams.get('search');

    // Initialize the mapping service
    await playerMappingService.initialize();

    // Search functionality
    if (search) {
      const results = await playerMappingService.searchPlayers(search);
      return NextResponse.json(results);
    }

    // Get specific player by blockchain ID
    if (blockchainId) {
      const mapping = await playerMappingService.getPlayerMapping(BigInt(blockchainId));
      
      if (!mapping) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      // Get FPL data for this player
      const fplData = await playerMappingService.getFplPlayerData(BigInt(blockchainId));
      
      return NextResponse.json({
        ...mapping,
        fplData
      });
    }

    // Get all mapped players
    const mappings = await playerMappingService.getAllMappings();
    const players = await fplService.getPlayers();
    
    // Enhance mappings with FPL data
    const enhancedPlayers = await Promise.all(
      mappings.map(async (mapping) => {
        const fplData = players.find(p => p.id === mapping.fplId);
        return {
          ...mapping,
          fplData
        };
      })
    );

    return NextResponse.json(enhancedPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}