import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PET_CARD_RACE_PETS,
  PET_CARD_RACE_RACE_PROFILES,
  PetCardRaceDailyLimit,
  PetCardRaceLeaderboardSize,
  PetCardRaceMaxAcceptedScore,
  PetCardRaceRacesPerMeet,
  type PetCardRaceLeaderboardEntry,
  type PetCardRacePetId,
  type PetCardRaceResponse,
  type PetCardRaceStatusResponse,
  type PetCardRaceTrainerAvatar,
  type PlayPetCardRaceCardsRequest,
} from '@voxora/contracts';
import { STARTER_AVATAR_ID } from '../../avatars/avatar-seed';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PET_CARD_RACE_ATTEMPT_COMPLETED,
  PET_CARD_RACE_ATTEMPT_EXPIRED,
  PET_CARD_RACE_ATTEMPT_FORFEITED,
  PET_CARD_RACE_ATTEMPT_RESERVED,
  PET_CARD_RACE_GAME_ID,
  PET_CARD_RACE_MEET_TTL_MS,
  PET_CARD_RACE_REWARD_NOTE,
  PET_CARD_RACE_RULES_VERSION,
  PET_CARD_RACE_VALIDATION_ACCEPTED,
  PET_CARD_RACE_VALIDATION_RESERVED,
} from './pet-card-race.constants';
import {
  createPetCardRaceMeet,
  forfeitPetCardRaceMeet,
  petCardRaceMeetIsFinished,
  playPetCardRaceCards,
  PetCardRaceRuleError,
  simulatePetCardRace,
  startNextPetCardRace,
  takePetCardRaceMeetView,
  type PetCardRaceMeetState,
} from './pet-card-race.engine';

type AttemptRecord = {
  id: string;
  attemptNumber: number;
  status: string;
  reservedAt: Date;
  expiresAt: Date | null;
  progressState: unknown;
};

@Injectable()
export class PetCardRaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string): Promise<PetCardRaceStatusResponse> {
    const dayKey = getUtcDayStart();
    const [counter, bestScore, trainerAvatar, raceWins] = await Promise.all([
      this.prisma.gameDailyCounter.findUnique({
        where: { userId_gameId_dayKey: { userId, gameId: PET_CARD_RACE_GAME_ID, dayKey } },
      }),
      this.getUserBestScore(userId),
      this.getTrainerAvatar(userId),
      this.countRaceWins(userId),
    ]);

    const leaderboard = await this.getLeaderboard(userId);
    const attemptsUsedToday = Math.min(counter?.attemptCount ?? 0, PetCardRaceDailyLimit);

    return {
      gameId: PET_CARD_RACE_GAME_ID,
      dayKey: dayKey.toISOString().slice(0, 10),
      dailyAttemptLimit: PetCardRaceDailyLimit,
      attemptsUsedToday,
      attemptsRemainingToday: PetCardRaceDailyLimit - attemptsUsedToday,
      racesPerMeet: PetCardRaceRacesPerMeet,
      trainerAvatar,
      bestScore,
      bestRank: leaderboard.find((entry) => entry.playerLabel === 'You')?.rank ?? null,
      raceWins,
      rewardStatus: 'REWARD_RULES_PENDING_OWNER_DECISION',
      rewardNote: PET_CARD_RACE_REWARD_NOTE,
      leaderboard: leaderboard.slice(0, PetCardRaceLeaderboardSize),
      pets: [...PET_CARD_RACE_PETS],
      raceProfiles: [...PET_CARD_RACE_RACE_PROFILES],
      petFoundationIntegrated: false,
      serverTime: new Date().toISOString(),
    };
  }

  /** Reserves one daily meet and shuffles the first race. Reservation is server-owned. */
  async startMeet(userId: string, petId: PetCardRacePetId) {
    const dayKey = getUtcDayStart();
    const now = new Date();
    const trainerAvatar = await this.getTrainerAvatar(userId);
    const meet = createPetCardRaceMeet({
      seed: randomBytes(24).toString('hex'),
      petId,
      nowMs: now.getTime(),
      trainerAvatarId: trainerAvatar?.avatarId ?? null,
      trainerAvatarName: trainerAvatar?.displayName ?? null,
    });

    const attempt = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.gameDailyCounter.upsert({
        where: { userId_gameId_dayKey: { userId, gameId: PET_CARD_RACE_GAME_ID, dayKey } },
        create: {
          userId,
          gameId: PET_CARD_RACE_GAME_ID,
          dayKey,
          attemptCount: 0,
          highScore: 0,
        },
        update: {},
      });

      const reserved = await tx.gameDailyCounter.updateMany({
        where: { id: counter.id, attemptCount: { lt: PetCardRaceDailyLimit } },
        data: { attemptCount: { increment: 1 } },
      });

      if (reserved.count !== 1) {
        throw new ConflictException('Daily Pet Card Race limit reached');
      }

      const updatedCounter = await tx.gameDailyCounter.findUniqueOrThrow({
        where: { id: counter.id },
      });

      return tx.gameAttempt.create({
        data: {
          userId,
          gameId: PET_CARD_RACE_GAME_ID,
          dayKey,
          attemptNumber: updatedCounter.attemptCount,
          status: PET_CARD_RACE_ATTEMPT_RESERVED,
          validationStatus: PET_CARD_RACE_VALIDATION_RESERVED,
          startState: {
            rulesVersion: PET_CARD_RACE_RULES_VERSION,
            racesPerMeet: PetCardRaceRacesPerMeet,
            maxAcceptedScore: PetCardRaceMaxAcceptedScore,
            firstPetId: petId,
            // Which Voxora avatar entered this meet, for attribution and audit.
            trainerAvatarId: trainerAvatar?.avatarId ?? null,
          },
          progressState: toJson(meet),
          reservedAt: now,
          expiresAt: new Date(now.getTime() + PET_CARD_RACE_MEET_TTL_MS),
        },
      });
    });

    return this.respond(userId, attempt, meet);
  }

  async sync(userId: string, attemptId: string): Promise<PetCardRaceResponse> {
    return this.mutate(userId, attemptId, (meet, nowMs) => {
      simulatePetCardRace(meet, nowMs);
    });
  }

  async playCards(
    userId: string,
    attemptId: string,
    input: PlayPetCardRaceCardsRequest,
  ): Promise<PetCardRaceResponse> {
    return this.mutate(userId, attemptId, (meet, nowMs) => {
      playPetCardRaceCards(
        meet,
        { cardIds: input.cardIds, targetCompetitorId: input.targetCompetitorId },
        nowMs,
      );
    });
  }

  async startNextRace(
    userId: string,
    attemptId: string,
    petId: PetCardRacePetId,
  ): Promise<PetCardRaceResponse> {
    return this.mutate(userId, attemptId, (meet, nowMs) => {
      startNextPetCardRace(meet, petId, nowMs);
    });
  }

  async forfeit(userId: string, attemptId: string): Promise<PetCardRaceResponse> {
    return this.mutate(userId, attemptId, (meet, nowMs) => {
      forfeitPetCardRaceMeet(meet, nowMs);
    });
  }

  private async mutate(
    userId: string,
    attemptId: string,
    apply: (meet: PetCardRaceMeetState, nowMs: number) => void,
  ): Promise<PetCardRaceResponse> {
    const attempt = await this.loadReservedAttempt(userId, attemptId);
    const meet = readMeetState(attempt.progressState);

    try {
      apply(meet, Date.now());
    } catch (error) {
      throw translateRuleError(error);
    }

    if (petCardRaceMeetIsFinished(meet)) {
      await this.finalizeAttempt(userId, attempt, meet);
    } else {
      await this.prisma.gameAttempt.updateMany({
        where: { id: attempt.id, status: PET_CARD_RACE_ATTEMPT_RESERVED },
        data: { progressState: toJson(meet) },
      });
    }

    return this.respond(userId, attempt, meet);
  }

  private async loadReservedAttempt(userId: string, attemptId: string): Promise<AttemptRecord> {
    const attempt = await this.prisma.gameAttempt.findUnique({ where: { id: attemptId } });

    if (!attempt) {
      throw new NotFoundException('Pet Card Race meet not found');
    }

    if (attempt.userId !== userId || attempt.gameId !== PET_CARD_RACE_GAME_ID) {
      throw new ForbiddenException('Pet Card Race meet does not belong to this user');
    }

    if (attempt.status !== PET_CARD_RACE_ATTEMPT_RESERVED) {
      throw new ConflictException('Pet Card Race meet has already been finalized');
    }

    if (attempt.expiresAt && attempt.expiresAt.getTime() < Date.now()) {
      await this.prisma.gameAttempt.updateMany({
        where: { id: attempt.id, status: PET_CARD_RACE_ATTEMPT_RESERVED },
        data: {
          status: PET_CARD_RACE_ATTEMPT_EXPIRED,
          validationStatus: PET_CARD_RACE_ATTEMPT_EXPIRED,
        },
      });
      throw new ConflictException('Pet Card Race meet has expired');
    }

    return attempt;
  }

  /**
   * Writes the server-computed meet score. The client never submits a score, so a finalized
   * attempt can only carry what the engine calculated from its own shuffle and rule checks.
   */
  private async finalizeAttempt(
    userId: string,
    attempt: AttemptRecord,
    meet: PetCardRaceMeetState,
  ): Promise<void> {
    const complete = meet.meetPhase === 'COMPLETE';
    const score = Math.min(meet.totalScore, PetCardRaceMaxAcceptedScore);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const finalized = await tx.gameAttempt.updateMany({
        where: { id: attempt.id, status: PET_CARD_RACE_ATTEMPT_RESERVED },
        data: {
          status: complete ? PET_CARD_RACE_ATTEMPT_COMPLETED : PET_CARD_RACE_ATTEMPT_FORFEITED,
          completionState: meet.meetPhase,
          validationStatus: PET_CARD_RACE_VALIDATION_ACCEPTED,
          progressState: toJson(meet),
          score: complete ? score : 0,
          durationMs: now.getTime() - attempt.reservedAt.getTime(),
          submittedAt: now,
          completedAt: now,
        },
      });

      if (finalized.count !== 1) {
        throw new ConflictException('Pet Card Race meet has already been finalized');
      }

      if (!complete) {
        return;
      }

      const counter = await tx.gameDailyCounter.findUnique({
        where: {
          userId_gameId_dayKey: {
            userId,
            gameId: PET_CARD_RACE_GAME_ID,
            dayKey: getUtcDayStart(now),
          },
        },
      });

      if (counter && score > counter.highScore) {
        await tx.gameDailyCounter.update({
          where: { id: counter.id },
          data: { highScore: score },
        });
      }
    });
  }

  private async respond(
    userId: string,
    attempt: AttemptRecord,
    meet: PetCardRaceMeetState,
  ): Promise<PetCardRaceResponse> {
    return {
      meet: takePetCardRaceMeetView(
        meet,
        { attemptId: attempt.id, attemptNumber: attempt.attemptNumber },
        Date.now(),
      ),
      status: await this.getStatus(userId),
    };
  }

  /**
   * The avatar that picks the pet. Read straight from the single avatar selection the Phase 3
   * Avatar Foundation owns, so this game holds no avatar state of its own.
   */
  private async getTrainerAvatar(userId: string): Promise<PetCardRaceTrainerAvatar | null> {
    const selection = await this.prisma.userAvatarSelection.findUnique({
      where: { userId },
      include: { avatar: true },
    });

    if (selection?.avatar?.active) {
      return toTrainerAvatar(selection.avatar);
    }

    // Same fallback the avatar card uses, so both surfaces name the same avatar.
    const starter = await this.prisma.userAvatarOwnership.findUnique({
      where: { userId_avatarId: { userId, avatarId: STARTER_AVATAR_ID } },
      include: { avatar: true },
    });

    return starter?.avatar?.active ? toTrainerAvatar(starter.avatar) : null;
  }

  /** Races won, read back from the server-owned meet state of finished meets. */
  private async countRaceWins(userId: string): Promise<number> {
    const attempts = await this.prisma.gameAttempt.findMany({
      where: {
        userId,
        gameId: PET_CARD_RACE_GAME_ID,
        status: PET_CARD_RACE_ATTEMPT_COMPLETED,
      },
      orderBy: { completedAt: 'desc' },
      select: { progressState: true },
      take: 100,
    });

    return attempts.reduce((wins, attempt) => {
      const races = (attempt.progressState as { completedRaces?: Array<{ yourPosition?: number }> })
        ?.completedRaces;
      if (!Array.isArray(races)) {
        return wins;
      }

      return wins + races.filter((race) => race.yourPosition === 1).length;
    }, 0);
  }

  private async getUserBestScore(userId: string): Promise<number> {
    const result = await this.prisma.gameAttempt.aggregate({
      where: {
        userId,
        gameId: PET_CARD_RACE_GAME_ID,
        status: PET_CARD_RACE_ATTEMPT_COMPLETED,
      },
      _max: { score: true },
    });

    return result._max.score ?? 0;
  }

  private async getLeaderboard(userId: string): Promise<PetCardRaceLeaderboardEntry[]> {
    const attempts = await this.prisma.gameAttempt.findMany({
      where: {
        gameId: PET_CARD_RACE_GAME_ID,
        status: PET_CARD_RACE_ATTEMPT_COMPLETED,
        score: { not: null },
      },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      select: { userId: true, score: true, completedAt: true },
      take: 250,
    });

    return rankPetCardRaceScores(
      userId,
      attempts.flatMap((attempt) =>
        attempt.score === null || attempt.completedAt === null
          ? []
          : [{ userId: attempt.userId, score: attempt.score, completedAt: attempt.completedAt }],
      ),
    );
  }
}

export type PetCardRaceCompletedScore = {
  userId: string;
  score: number;
  completedAt: Date;
};

/** Highest meet score first; ties go to the earliest authoritative server completion. */
export function rankPetCardRaceScores(
  userId: string,
  attempts: PetCardRaceCompletedScore[],
): PetCardRaceLeaderboardEntry[] {
  const seen = new Set<string>();
  const leaderboard: PetCardRaceLeaderboardEntry[] = [];

  const ordered = [...attempts].sort(
    (a, b) => b.score - a.score || a.completedAt.getTime() - b.completedAt.getTime(),
  );

  for (const attempt of ordered) {
    if (seen.has(attempt.userId)) {
      continue;
    }

    seen.add(attempt.userId);
    const rank = leaderboard.length + 1;
    leaderboard.push({
      rank,
      playerLabel: attempt.userId === userId ? 'You' : `Voxora player #${rank}`,
      score: attempt.score,
    });
  }

  return leaderboard;
}

function toTrainerAvatar(avatar: {
  id: string;
  displayName: string;
  thumbnailRef: string;
}): PetCardRaceTrainerAvatar {
  return {
    avatarId: avatar.id,
    displayName: avatar.displayName,
    thumbnailRef: avatar.thumbnailRef,
  };
}

function readMeetState(progressState: unknown): PetCardRaceMeetState {
  if (!progressState || typeof progressState !== 'object') {
    throw new ConflictException('Pet Card Race meet state is unavailable');
  }

  return progressState as PetCardRaceMeetState;
}

function toJson(meet: PetCardRaceMeetState): object {
  return JSON.parse(JSON.stringify(meet)) as object;
}

function translateRuleError(error: unknown): Error {
  if (!(error instanceof PetCardRaceRuleError)) {
    return error instanceof Error ? error : new Error('Pet Card Race request failed');
  }

  switch (error.code) {
    case 'COOLDOWN':
    case 'STATE':
      return new ConflictException(error.message);
    default:
      return new BadRequestException(error.message);
  }
}

function getUtcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
