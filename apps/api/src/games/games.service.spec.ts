import { describe, expect, it } from 'vitest';
import { rankWhiteWolfScores } from './games.service';

describe('White Wolf Moon Dash leaderboard ranking', () => {
  it('ranks higher scores first and breaks ties by earliest server completion timestamp', () => {
    const leaderboard = rankWhiteWolfScores('user-b', [
      { userId: 'user-a', score: 27, completedAt: new Date('2026-08-13T12:00:00.000Z') },
      { userId: 'user-b', score: 27, completedAt: new Date('2026-08-13T11:00:00.000Z') },
      { userId: 'user-c', score: 22, completedAt: new Date('2026-08-13T10:00:00.000Z') },
    ]);

    expect(leaderboard.map((entry) => entry.playerLabel)).toEqual([
      'You',
      'Voxora player #2',
      'Voxora player #3',
    ]);
    expect(leaderboard[0]).toMatchObject({
      rank: 1,
      score: 27,
      prizeEligible: true,
      prizeStatus: 'CURRENT_LEADER',
    });
    expect(leaderboard[1]).toMatchObject({
      rank: 2,
      prizeEligible: true,
      prizeStatus: 'PROVISIONAL_WINNER',
    });
    expect(leaderboard[2]).toMatchObject({
      rank: 3,
      prizeEligible: false,
      prizeStatus: 'NOT_IN_PRIZE_POSITION',
    });
  });

  it('uses each user only once with their earliest highest-score attempt', () => {
    const leaderboard = rankWhiteWolfScores('user-a', [
      { userId: 'user-a', score: 24, completedAt: new Date('2026-08-13T12:00:00.000Z') },
      { userId: 'user-a', score: 24, completedAt: new Date('2026-08-13T13:00:00.000Z') },
      { userId: 'user-b', score: 23, completedAt: new Date('2026-08-13T09:00:00.000Z') },
    ]);

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]?.playerLabel).toBe('You');
    expect(leaderboard[0]?.rank).toBe(1);
  });
});
