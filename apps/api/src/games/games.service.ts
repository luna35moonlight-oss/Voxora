import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  WhiteWolfMoonDashDailyLimit,
  WhiteWolfMoonDashPrizeRanks,
  type CompleteWhiteWolfAttemptRequest,
  type WhiteWolfGameStatusResponse,
  type WhiteWolfLeaderboardEntry,
  type WhiteWolfRewardStatus,
} from '@voxora/contracts';
import { PrismaService } from '../prisma/prisma.service';
import {
  WHITE_WOLF_ATTEMPT_COMPLETED,
  WHITE_WOLF_ATTEMPT_STARTED,
  WHITE_WOLF_GAME_ID,
} from './games.constants';

const rewardNote =
  'First and Second place qualify for Voxora team review and manual legendary avatar redeem-code issue.';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async getWhiteWolfStatus(userId: string): Promise<WhiteWolfGameStatusResponse> {
    const dayKey = getUtcDayStart();
    const [counter, bestScore] = await Promise.all([
      this.prisma.gameDailyCounter.findUnique({
        where: {
          userId_gameId_dayKey: {
            userId,
            gameId: WHITE_WOLF_GAME_ID,
            dayKey,
          },
        },
      }),
      this.getUserBestScore(userId),
    ]);
    const leaderboard = await this.getLeaderboard(userId);
    const bestRank = leaderboard.find((entry) => entry.playerLabel === 'You')?.rank ?? null;

    return buildStatus({
      attemptsUsedToday: counter?.attemptCount ?? 0,
      bestRank,
      bestScore,
      leaderboard: leaderboard.slice(0, WhiteWolfMoonDashPrizeRanks),
    });
  }

  async startWhiteWolfAttempt(userId: string) {
    const dayKey = getUtcDayStart();

    const attempt = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.gameDailyCounter.upsert({
        where: {
          userId_gameId_dayKey: {
            userId,
            gameId: WHITE_WOLF_GAME_ID,
            dayKey,
          },
        },
        create: {
          userId,
          gameId: WHITE_WOLF_GAME_ID,
          dayKey,
          attemptCount: 0,
          highScore: 0,
        },
        update: {},
      });

      if (counter.attemptCount >= WhiteWolfMoonDashDailyLimit) {
        throw new ConflictException('Daily White Wolf Moon Dash limit reached');
      }

      await tx.gameDailyCounter.update({
        where: { id: counter.id },
        data: { attemptCount: { increment: 1 } },
      });

      return tx.gameAttempt.create({
        data: {
          userId,
          gameId: WHITE_WOLF_GAME_ID,
          dayKey,
          status: WHITE_WOLF_ATTEMPT_STARTED,
        },
      });
    });

    return {
      attemptId: attempt.id,
      status: await this.getWhiteWolfStatus(userId),
    };
  }

  async completeWhiteWolfAttempt(
    userId: string,
    attemptId: string,
    input: CompleteWhiteWolfAttemptRequest,
  ) {
    const attempt = await this.prisma.gameAttempt.findUnique({ where: { id: attemptId } });

    if (!attempt) {
      throw new NotFoundException('White Wolf Moon Dash attempt not found');
    }

    if (attempt.userId !== userId || attempt.gameId !== WHITE_WOLF_GAME_ID) {
      throw new ForbiddenException('White Wolf Moon Dash attempt does not belong to this user');
    }

    if (attempt.status !== WHITE_WOLF_ATTEMPT_STARTED) {
      throw new ConflictException('White Wolf Moon Dash attempt has already been completed');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.gameAttempt.update({
        where: { id: attemptId },
        data: {
          status: WHITE_WOLF_ATTEMPT_COMPLETED,
          score: input.score,
          durationMs: input.durationMs,
          completedAt: new Date(),
        },
      });

      const counter = await tx.gameDailyCounter.findUnique({
        where: {
          userId_gameId_dayKey: {
            userId,
            gameId: WHITE_WOLF_GAME_ID,
            dayKey: attempt.dayKey,
          },
        },
      });

      if (counter && input.score > counter.highScore) {
        await tx.gameDailyCounter.update({
          where: { id: counter.id },
          data: { highScore: input.score },
        });
      }
    });

    return {
      status: await this.getWhiteWolfStatus(userId),
    };
  }

  private async getUserBestScore(userId: string): Promise<number> {
    const result = await this.prisma.gameAttempt.aggregate({
      where: {
        userId,
        gameId: WHITE_WOLF_GAME_ID,
        status: WHITE_WOLF_ATTEMPT_COMPLETED,
      },
      _max: { score: true },
    });

    return result._max.score ?? 0;
  }

  private async getLeaderboard(userId: string): Promise<WhiteWolfLeaderboardEntry[]> {
    const attempts = await this.prisma.gameAttempt.findMany({
      where: {
        gameId: WHITE_WOLF_GAME_ID,
        status: WHITE_WOLF_ATTEMPT_COMPLETED,
        score: { not: null },
      },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      select: {
        userId: true,
        score: true,
      },
      take: 250,
    });

    const seen = new Set<string>();
    const leaderboard: WhiteWolfLeaderboardEntry[] = [];

    for (const attempt of attempts) {
      if (seen.has(attempt.userId) || attempt.score === null) {
        continue;
      }

      seen.add(attempt.userId);
      const rank = leaderboard.length + 1;
      leaderboard.push({
        rank,
        playerLabel: attempt.userId === userId ? 'You' : `Voxora player #${rank}`,
        score: attempt.score,
        prizeEligible: rank <= WhiteWolfMoonDashPrizeRanks,
      });
    }

    return leaderboard;
  }
}

function buildStatus(input: {
  attemptsUsedToday: number;
  bestScore: number;
  bestRank: number | null;
  leaderboard: WhiteWolfLeaderboardEntry[];
}): WhiteWolfGameStatusResponse {
  const attemptsUsedToday = Math.min(input.attemptsUsedToday, WhiteWolfMoonDashDailyLimit);
  const bestRank = input.bestRank;

  return {
    gameId: WHITE_WOLF_GAME_ID,
    dayKey: getUtcDayStart().toISOString().slice(0, 10),
    dailyAttemptLimit: WhiteWolfMoonDashDailyLimit,
    attemptsUsedToday,
    attemptsRemainingToday: WhiteWolfMoonDashDailyLimit - attemptsUsedToday,
    bestScore: input.bestScore,
    bestRank,
    prizeRanks: WhiteWolfMoonDashPrizeRanks,
    rewardStatus: getRewardStatus(bestRank),
    rewardNote,
    leaderboard: input.leaderboard,
    serverTime: new Date().toISOString(),
  };
}

function getRewardStatus(bestRank: number | null): WhiteWolfRewardStatus {
  if (bestRank === null) {
    return 'not_ranked';
  }

  if (bestRank <= WhiteWolfMoonDashPrizeRanks) {
    return 'eligible_pending_team_code';
  }

  return 'not_in_prize_position';
}

function getUtcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
