import { NextResponse } from 'next/server';
import { fplService } from '@/lib/services/fplService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const current = searchParams.get('current');
    const gameweekId = searchParams.get('id');

    // Get current gameweek
    if (current === 'true') {
      const currentGameweek = await fplService.getCurrentGameweek();
      if (!currentGameweek) {
        return NextResponse.json({ error: 'No current gameweek found' }, { status: 404 });
      }
      return NextResponse.json(currentGameweek);
    }

    // Get specific gameweek
    if (gameweekId) {
      const gameweeks = await fplService.getGameweeks();
      const gameweek = gameweeks.find(gw => gw.id === parseInt(gameweekId));
      if (!gameweek) {
        return NextResponse.json({ error: 'Gameweek not found' }, { status: 404 });
      }
      return NextResponse.json(gameweek);
    }

    // Get all gameweeks
    const gameweeks = await fplService.getGameweeks();
    return NextResponse.json(gameweeks);
  } catch (error) {
    console.error('Error fetching gameweeks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gameweeks' },
      { status: 500 }
    );
  }
}
