import { NextResponse } from 'next/server';
import { fplService } from '@/lib/services/fplService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get('gameweek');
    const team = searchParams.get('team');

    // Get fixtures with optional filters
    let fixtures = await fplService.getFixtures(
      gameweek ? parseInt(gameweek) : undefined
    );

    // Filter by team if specified
    if (team) {
      const teamId = parseInt(team);
      fixtures = fixtures.filter(
        f => f.team_h === teamId || f.team_a === teamId
      );
    }

    // Enhance fixtures with team names and difficulty ratings
    const teams = await fplService.getTeams();
    const enhancedFixtures = fixtures.map(fixture => {
      const homeTeam = teams.find(t => t.id === fixture.team_h);
      const awayTeam = teams.find(t => t.id === fixture.team_a);

      return {
        ...fixture,
        home_team_name: homeTeam?.name || 'Unknown',
        away_team_name: awayTeam?.name || 'Unknown',
        home_team_short: homeTeam?.short_name || 'UNK',
        away_team_short: awayTeam?.short_name || 'UNK',
        home_difficulty: fplService.getDifficultyRating(fixture.team_h_difficulty),
        away_difficulty: fplService.getDifficultyRating(fixture.team_a_difficulty),
        home_difficulty_color: fplService.getDifficultyColor(fixture.team_h_difficulty),
        away_difficulty_color: fplService.getDifficultyColor(fixture.team_a_difficulty),
      };
    });

    return NextResponse.json(enhancedFixtures);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fixtures' },
      { status: 500 }
    );
  }
}
