import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  WhiteWolfMoonDashMaxAcceptedScore,
  WhiteWolfMoonDashDailyLimit,
  WhiteWolfMoonDashPrizeRanks,
  type CompleteWhiteWolfAttemptRequest,
  type WhiteWolfGameStatusResponse,
  type WhiteWolfLeaderboardEntry,
  type WhiteWolfRewardStatus,
} from '@voxora/contracts';
import { PrismaService } from '../prisma/prisma.service';
import {
  WHITE_WOLF_ATTEMPT_EXPIRED,
  WHITE_WOLF_ATTEMPT_FORFEITED,
  WHITE_WOLF_ATTEMPT_COMPLETED,
  WHITE_WOLF_ATTEMPT_RESERVED,
  WHITE_WOLF_RUN_TTL_MS,
  WHITE_WOLF_VALIDATION_ACCEPTED,
  WHITE_WOLF_VALIDATION_RESERVED,
  WHITE_WOLF_GAME_ID,
} from './games.constants';

const rewardNote =
  'First and Second place are provisional only until OWNER review; legendary avatar redeem codes are manually issued by the Voxora team.';
const whiteWolfTargetScore = 24;

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
      const now = new Date();
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

      const reserved = await tx.gameDailyCounter.updateMany({
        where: { id: counter.id, attemptCount: { lt: WhiteWolfMoonDashDailyLimit } },
        data: { attemptCount: { increment: 1 } },
      });

      if (reserved.count !== 1) {
        throw new ConflictException('Daily White Wolf Moon Dash limit reached');
      }

      const updatedCounter = await tx.gameDailyCounter.findUniqueOrThrow({
        where: { id: counter.id },
      });

      return tx.gameAttempt.create({
        data: {
          userId,
          gameId: WHITE_WOLF_GAME_ID,
          dayKey,
          attemptNumber: updatedCounter.attemptCount,
          status: WHITE_WOLF_ATTEMPT_RESERVED,
          validationStatus: WHITE_WOLF_VALIDATION_RESERVED,
          startState: {
            rulesVersion: 'phase-2.5',
            targetScore: whiteWolfTargetScore,
            maxAcceptedScore: WhiteWolfMoonDashMaxAcceptedScore,
          },
          reservedAt: now,
          expiresAt: new Date(now.getTime() + WHITE_WOLF_RUN_TTL_MS),
        },
      });
    });

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
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

    if (attempt.status !== WHITE_WOLF_ATTEMPT_RESERVED) {
      throw new ConflictException('White Wolf Moon Dash attempt has already been finalized');
    }

    if (attempt.expiresAt && attempt.expiresAt.getTime() < Date.now()) {
      await this.prisma.gameAttempt.update({
        where: { id: attemptId },
        data: {
          status: WHITE_WOLF_ATTEMPT_EXPIRED,
          validationStatus: WHITE_WOLF_ATTEMPT_EXPIRED,
        },
      });
      throw new ConflictException('White Wolf Moon Dash attempt has expired');
    }

    validateCompletedAttempt(input);

    await this.prisma.$transaction(async (tx) => {
      const finalStatus =
        input.outcome === 'forfeited' ? WHITE_WOLF_ATTEMPT_FORFEITED : WHITE_WOLF_ATTEMPT_COMPLETED;
      const finalized = await tx.gameAttempt.updateMany({
        where: { id: attemptId, status: WHITE_WOLF_ATTEMPT_RESERVED },
        data: {
          status: finalStatus,
          completionState: input.outcome,
          validationStatus: WHITE_WOLF_VALIDATION_ACCEPTED,
          score: input.score,
          durationMs: input.durationMs,
          submittedAt: new Date(),
          completedAt: new Date(),
        },
      });

      if (finalized.count !== 1) {
        throw new ConflictException('White Wolf Moon Dash attempt has already been finalized');
      }

      if (finalStatus !== WHITE_WOLF_ATTEMPT_COMPLETED) {
        return;
      }

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
        completedAt: true,
      },
      take: 250,
    });

    return rankWhiteWolfScores(
      userId,
      attempts.flatMap((attempt) =>
        attempt.score === null || attempt.completedAt === null
          ? []
          : [{ userId: attempt.userId, score: attempt.score, completedAt: attempt.completedAt }],
      ),
    );
  }
}

export type WhiteWolfCompletedScore = {
  userId: string;
  score: number;
  completedAt: Date;
};

export function rankWhiteWolfScores(
  userId: string,
  attempts: WhiteWolfCompletedScore[],
): WhiteWolfLeaderboardEntry[] {
  const seen = new Set<string>();
  const leaderboard: WhiteWolfLeaderboardEntry[] = [];

  const ordered = [...attempts].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.completedAt.getTime() - b.completedAt.getTime();
  });

  for (const attempt of ordered) {
    if (seen.has(attempt.userId)) {
      continue;
    }

    seen.add(attempt.userId);
    const rank = leaderboard.length + 1;
    const prizeEligible = rank <= WhiteWolfMoonDashPrizeRanks;
    leaderboard.push({
      rank,
      playerLabel: attempt.userId === userId ? 'You' : `Voxora player #${rank}`,
      score: attempt.score,
      prizeEligible,
      prizeStatus:
        rank === 1
          ? 'CURRENT_LEADER'
          : prizeEligible
            ? 'PROVISIONAL_WINNER'
            : 'NOT_IN_PRIZE_POSITION',
    });
  }

  return leaderboard;
}

function validateCompletedAttempt(input: CompleteWhiteWolfAttemptRequest) {
  if (input.outcome === 'won' && input.score < whiteWolfTargetScore) {
    throw new BadRequestException('Winning Moon Dash score is below the target score');
  }

  if (input.durationMs !== undefined && input.score > 0 && input.durationMs < 500) {
    throw new BadRequestException('Moon Dash run duration is not plausible for a scoring run');
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
    return 'NOT_RANKED';
  }

  if (bestRank <= WhiteWolfMoonDashPrizeRanks) {
    return bestRank === 1 ? 'CURRENT_LEADER' : 'PROVISIONAL_WINNER';
  }

  return 'NOT_IN_PRIZE_POSITION';
}

function getUtcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
