import { describe, expect, it } from 'vitest';
import { rankPetCardRaceScores } from './pet-card-race.service';

describe('Pet Card Race leaderboard ranking', () => {
  it('ranks higher meet scores first and breaks ties by earliest server completion', () => {
    const leaderboard = rankPetCardRaceScores('user-b', [
      { userId: 'user-a', score: 210, completedAt: new Date('2026-08-17T12:00:00.000Z') },
      { userId: 'user-b', score: 210, completedAt: new Date('2026-08-17T11:00:00.000Z') },
      { userId: 'user-c', score: 140, completedAt: new Date('2026-08-17T10:00:00.000Z') },
    ]);

    expect(leaderboard).toEqual([
      { rank: 1, playerLabel: 'You', score: 210 },
      { rank: 2, playerLabel: 'Voxora player #2', score: 210 },
      { rank: 3, playerLabel: 'Voxora player #3', score: 140 },
    ]);
  });

  it('keeps only each player’s best meet', () => {
    const leaderboard = rankPetCardRaceScores('user-a', [
      { userId: 'user-a', score: 150, completedAt: new Date('2026-08-17T12:00:00.000Z') },
      { userId: 'user-a', score: 90, completedAt: new Date('2026-08-17T13:00:00.000Z') },
      { userId: 'user-b', score: 120, completedAt: new Date('2026-08-17T09:00:00.000Z') },
    ]);

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]).toMatchObject({ rank: 1, playerLabel: 'You', score: 150 });
  });
});
