import { describe, expect, it } from 'vitest';
import {
  CompleteWhiteWolfAttemptRequestSchema,
  isPrivilegedRole,
  PRIVILEGED_ROLES,
  RoleName,
  WhiteWolfGameStatusResponseSchema,
  WhiteWolfMoonDashDailyLimit,
  WhiteWolfMoonDashPrizeRanks,
} from './index';

describe('RBAC contracts', () => {
  it('marks owner/admin/moderator/support as privileged', () => {
    expect(isPrivilegedRole('OWNER')).toBe(true);
    expect(isPrivilegedRole('ADMIN')).toBe(true);
    expect(isPrivilegedRole('MODERATOR')).toBe(true);
    expect(isPrivilegedRole('SUPPORT')).toBe(true);
    expect(isPrivilegedRole('USER')).toBe(false);
    expect(isPrivilegedRole('SERVICE_ACCOUNT')).toBe(false);
  });

  it('parses role names', () => {
    expect(RoleName.parse('OWNER')).toBe('OWNER');
    expect(() => RoleName.parse('superuser')).toThrow();
  });

  it('lists privileged roles without USER', () => {
    expect(PRIVILEGED_ROLES).not.toContain('USER');
  });
});

describe('white wolf moon dash contracts', () => {
  it('accepts bounded completed scores only', () => {
    expect(CompleteWhiteWolfAttemptRequestSchema.parse({ score: 24, outcome: 'won' })).toEqual({
      score: 24,
      outcome: 'won',
    });
    expect(() =>
      CompleteWhiteWolfAttemptRequestSchema.parse({ score: 41, outcome: 'won' }),
    ).toThrow();
    expect(() =>
      CompleteWhiteWolfAttemptRequestSchema.parse({ score: -1, outcome: 'resting' }),
    ).toThrow();
  });

  it('describes daily limits and prize positions', () => {
    const parsed = WhiteWolfGameStatusResponseSchema.parse({
      gameId: 'white-wolf-moon-dash',
      dayKey: '2026-08-13',
      dailyAttemptLimit: WhiteWolfMoonDashDailyLimit,
      attemptsUsedToday: 2,
      attemptsRemainingToday: 8,
      bestScore: 27,
      bestRank: 1,
      prizeRanks: WhiteWolfMoonDashPrizeRanks,
      rewardStatus: 'PROVISIONAL_WINNER',
      rewardNote:
        'First and Second place qualify for Voxora team review and manual redeem-code issue.',
      leaderboard: [
        {
          rank: 1,
          playerLabel: 'You',
          score: 27,
          prizeEligible: true,
          prizeStatus: 'PROVISIONAL_WINNER',
        },
      ],
      serverTime: '2026-08-13T00:00:00.000Z',
    });

    expect(parsed.dailyAttemptLimit).toBe(10);
    expect(parsed.prizeRanks).toBe(2);
    expect(parsed.rewardStatus).toBe('PROVISIONAL_WINNER');
  });
});
