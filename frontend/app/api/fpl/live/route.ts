// front end/app/api/fpl/players/route.ts
import { NextResponse } from 'next/server';
import { fplService } from '@/lib/services/fplService';
import { playerMappingService } from '@/lib/services/playerMappingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchainId = searchParams.get('blockchainId');
    const search = searchParams.get('search');
    const fplId = searchParams.get('fplId');

    // Get player by blockchain ID
    if (blockchainId) {
      const mapping = await playerMappingService.getPlayerMapping(BigInt(blockchainId));
      if (!mapping) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      const fplData = await playerMappingService.getFplPlayerData(BigInt(blockchainId));
      if (!fplData) {
        return NextResponse.json({ error: 'FPL data not found' }, { status: 404 });
      }

      const teams = await fplService.getTeams();
      const team = teams.find(t => t.id === fplData.team);

      return NextResponse.json({
        blockchainId: mapping.blockchainId.toString(),
        fplId: mapping.fplId,
        name: mapping.name,
        team: team?.name || 'Unknown',
        position: fplService.getPositionShort(fplData.element_type),
        fplData
      });
    }

    // Search players
    if (search) {
      const results = await playerMappingService.searchPlayers(search);
      const enhancedResults = await Promise.all(
        results.map(async (mapping) => {
          const fplData = await fplService.getPlayer(mapping.fplId);
          return {
            ...mapping,
            blockchainId: mapping.blockchainId.toString(),
            fplData
          };
        })
      );
      return NextResponse.json(enhancedResults);
    }

    // Get player by FPL ID
    if (fplId) {
      const fplData = await fplService.getPlayer(parseInt(fplId));
      if (!fplData) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      const blockchainId = await playerMappingService.getBlockchainId(parseInt(fplId));
      const teams = await fplService.getTeams();
      const team = teams.find(t => t.id === fplData.team);

      return NextResponse.json({
        blockchainId: blockchainId?.toString() || null,
        fplId: fplData.id,
        name: fplData.web_name,
        team: team?.name || 'Unknown',
        position: fplService.getPositionShort(fplData.element_type),
        fplData
      });
    }

    // Get all mapped players
    const mappings = await playerMappingService.getAllMappings();
    const players = await fplService.getPlayers();
    const teams = await fplService.getTeams();

    const enhancedPlayers = mappings.map(mapping => {
      const fplData = players.find(p => p.id === mapping.fplId);
      const team = teams.find(t => t.id === fplData?.team);
      
      return {
        blockchainId: mapping.blockchainId.toString(),
        fplId: mapping.fplId,
        name: mapping.name,
        team: team?.name || 'Unknown',
        position: mapping.position,
        fplData: fplData || null
      };
    });

    return NextResponse.json(enhancedPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
