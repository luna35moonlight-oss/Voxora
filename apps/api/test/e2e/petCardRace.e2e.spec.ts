import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../dist/app.module';
import { AllExceptionsFilter } from '../../dist/common/all-exceptions.filter';
import { correlationMiddleware } from '../../dist/common/correlation.middleware';

type Card = {
  cardId: string;
  type: 'RANK' | 'JOKER' | 'TACTIC';
  rank: string | null;
  tactic: string | null;
  fast: boolean;
  label: string;
};

type Competitor = {
  competitorId: string;
  isYou: boolean;
  progressMetres: number;
  speedMetresPerSecond: number;
  pet: { petId: string; source: string; silhouette: string };
};

const COUNTDOWN_WAIT_MS = 3_600;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Voxora Pet Card Race (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_PORT = '3002';
    process.env.API_HOST = '127.0.0.1';
    process.env.CORS_ORIGINS = 'http://localhost:8081';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL_TEST ??
      'postgresql://voxora:voxora@127.0.0.1:5432/voxora_test?schema=public';
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters!!';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters!';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '30d';
    process.env.OWNER_BOOTSTRAP_EMAIL = 'luna35moonlight@gmail.com';
    process.env.OWNER_BOOTSTRAP_TOKEN = 'pet-card-race-test-bootstrap-token';
    process.env.EMAIL_PROVIDER = 'dev';
    process.env.PHONE_PROVIDER = 'dev';
    process.env.MFA_ENCRYPTION_KEY = 'test-mfa-encryption-key-min-32-chars!!';

    await prisma.$connect();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(helmet());
    app.use(correlationMiddleware);
    app.setGlobalPrefix('v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  beforeEach(async () => {
    await prisma.gameAttempt.deleteMany();
    await prisma.gameDailyCounter.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationRecord.deleteMany();
    await prisma.devDeliveryArtifact.deleteMany();
    await prisma.onboardingState.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.roleAssignment.deleteMany();
    await prisma.authIdentity.deleteMany();
    await prisma.userAvatarEquipment.deleteMany();
    await prisma.userAvatarSelection.deleteMany();
    await prisma.userAvatarItemOwnership.deleteMany();
    await prisma.userAvatarOwnership.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function signIn() {
    const email = `racer_${Date.now()}_${Math.floor(Math.random() * 10_000)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password: 'secure-pass-123' })
      .expect(201);

    return res.body.tokens.accessToken as string;
  }

  function startMeet(token: string, petId = 'moonlit-wolf') {
    return request(app.getHttpServer())
      .post('/v1/games/pet-card-race/meets/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ petId });
  }

  function sync(token: string, attemptId: string) {
    return request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/sync`)
      .set('Authorization', `Bearer ${token}`);
  }

  function play(token: string, attemptId: string, body: unknown) {
    return request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/plays`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  /** A card that can legally be played on its own, plus the target a chaser needs. */
  function playableSingle(
    hand: Card[],
    rivalCompetitorId: string,
  ): { cardIds: string[]; targetCompetitorId?: string } {
    const rankCard = hand.find((card) => card.type === 'RANK');
    if (rankCard) {
      return { cardIds: [rankCard.cardId] };
    }

    const card = hand[0];
    if (!card) {
      throw new Error('Empty hand');
    }

    return card.tactic === 'CHASER'
      ? { cardIds: [card.cardId], targetCompetitorId: rivalCompetitorId }
      : { cardIds: [card.cardId] };
  }

  it('reports an honest daily status with placeholder pets and no reward rules', async () => {
    const token = await signIn();
    const res = await request(app.getHttpServer())
      .get('/v1/games/pet-card-race/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      gameId: 'voxora-pet-card-race',
      dailyAttemptLimit: 10,
      attemptsUsedToday: 0,
      attemptsRemainingToday: 10,
      racesPerMeet: 3,
      bestScore: 0,
      bestRank: null,
      rewardStatus: 'REWARD_RULES_PENDING_OWNER_DECISION',
      leaderboard: [],
      raceWins: 0,
      petFoundationIntegrated: false,
    });
    expect(res.body.pets).toHaveLength(4);
    expect(
      (res.body.pets as Competitor['pet'][]).every(
        (pet) => pet.source === 'DEVELOPMENT_PLACEHOLDER',
      ),
    ).toBe(true);
    // Distinct silhouettes so a panther never runs as a wolf.
    expect(new Set((res.body.pets as Competitor['pet'][]).map((pet) => pet.silhouette)).size).toBe(
      4,
    );
    expect(res.body.raceProfiles.every((profile: { approved: boolean }) => !profile.approved)).toBe(
      true,
    );
  });

  it('names the Voxora avatar that enters the race once one is selected', async () => {
    const token = await signIn();

    const before = await request(app.getHttpServer())
      .get('/v1/games/pet-card-race/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(before.body.trainerAvatar).toBeNull();

    const avatar = await request(app.getHttpServer())
      .get('/v1/avatars/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const owned = (avatar.body.catalogue as Array<{ id: string; owned: boolean }>).find(
      (entry) => entry.owned,
    );
    await request(app.getHttpServer())
      .post('/v1/avatars/select')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarId: owned?.id })
      .expect(201);

    const after = await request(app.getHttpServer())
      .get('/v1/games/pet-card-race/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(after.body.trainerAvatar).toMatchObject({ avatarId: owned?.id });

    const started = await startMeet(token).expect(201);
    const you = (started.body.meet.currentRace.competitors as Competitor[]).find(
      (competitor) => competitor.isYou,
    );
    expect(you).toMatchObject({ competitorId: 'you' });
    expect(started.body.meet.currentRace.competitors[0]).toHaveProperty('trainerAvatarName');

    const stored = await prisma.gameAttempt.findUniqueOrThrow({
      where: { id: started.body.meet.attemptId },
    });
    expect((stored.startState as { trainerAvatarId?: string }).trainerAvatarId).toBe(owned?.id);
  });

  it('rejects an unauthenticated meet', async () => {
    await request(app.getHttpServer())
      .post('/v1/games/pet-card-race/meets/start')
      .send({ petId: 'moonlit-wolf' })
      .expect(401);
  });

  it('lines up four teams behind a countdown and keeps the card pool server side', async () => {
    const token = await signIn();
    const res = await startMeet(token).expect(201);
    const current = res.body.meet.currentRace;

    expect(res.body.meet).toMatchObject({
      attemptNumber: 1,
      meetPhase: 'RACING',
      raceNumber: 1,
      racesTotal: 3,
      meetScore: 0,
      usedPetIds: ['moonlit-wolf'],
    });
    expect(current.phase).toBe('COUNTDOWN');
    expect(current.countdownRemainingMs).toBeGreaterThan(0);
    expect(current.competitors).toHaveLength(4);
    expect(
      (current.competitors as Competitor[]).every((competitor) => competitor.progressMetres === 0),
    ).toBe(true);
    expect(new Set((current.competitors as Competitor[]).map((c) => c.pet.petId)).size).toBe(4);
    expect(current.hand).toHaveLength(8);
    expect(current.checkpointsReached).toBe(0);
    expect(current.cardsLeftToDeal).toBe(16);
    expect(
      current.checkpoints.map((checkpoint: { cardsAwarded: number }) => checkpoint.cardsAwarded),
    ).toEqual([3, 3, 3, 3, 4]);
    expect(res.body.status.attemptsUsedToday).toBe(1);

    const payload = JSON.stringify(res.body);
    expect(payload).not.toContain('drawPile');
    expect(payload).not.toContain('paceOffsetMs');
    expect(payload).not.toContain('seed');
  });

  it('runs all four pets on the server clock while the client only syncs', async () => {
    const token = await signIn();
    const started = await startMeet(token).expect(201);
    const attemptId = started.body.meet.attemptId as string;

    await wait(COUNTDOWN_WAIT_MS + 1_500);

    const synced = await sync(token, attemptId).expect(201);
    const competitors = synced.body.meet.currentRace.competitors as Competitor[];

    expect(synced.body.meet.currentRace.phase).toBe('RUNNING');
    expect(competitors).toHaveLength(4);
    for (const competitor of competitors) {
      expect(competitor.progressMetres).toBeGreaterThan(0);
      expect(competitor.speedMetresPerSecond).toBeGreaterThan(0);
    }
    expect(synced.body.meet.currentRace.serverTimeMs).toBeGreaterThan(0);
  });

  it('refuses plays before GO, then accepts one and holds the five second cooldown', async () => {
    const token = await signIn();
    const started = await startMeet(token).expect(201);
    const attemptId = started.body.meet.attemptId as string;
    const hand = started.body.meet.currentRace.hand as Card[];
    const rival = (started.body.meet.currentRace.competitors as Competitor[]).find(
      (competitor) => !competitor.isYou,
    );

    const early = await play(token, attemptId, playableSingle(hand, rival!.competitorId)).expect(
      409,
    );
    expect(early.body.message).toMatch(/Wait for GO/);

    await wait(COUNTDOWN_WAIT_MS);

    await play(token, attemptId, { cardIds: ['not-a-dealt-card'] }).expect(400);

    const played = await play(token, attemptId, playableSingle(hand, rival!.competitorId)).expect(
      201,
    );
    expect(played.body.meet.currentRace.hand).toHaveLength(7);
    expect(played.body.meet.currentRace.cooldownRemainingMs).toBeGreaterThan(0);

    const tooSoon = await play(
      token,
      attemptId,
      playableSingle(played.body.meet.currentRace.hand as Card[], rival!.competitorId),
    ).expect(409);
    expect(tooSoon.body.message).toMatch(/Wait \d+s/);

    const stored = await prisma.gameAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    const progress = stored.progressState as { currentRace: { hand: Card[] } };
    expect(progress.currentRace.hand).toHaveLength(7);
    expect(stored.score).toBeNull();
  });

  it('keeps one player out of another player’s meet', async () => {
    const owner = await signIn();
    const intruder = await signIn();
    const started = await startMeet(owner).expect(201);

    await sync(intruder, started.body.meet.attemptId as string).expect(403);
  });

  it('leaves a meet with a zero score and no leaderboard entry', async () => {
    const token = await signIn();
    const started = await startMeet(token).expect(201);
    const attemptId = started.body.meet.attemptId as string;

    const forfeited = await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/forfeit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(forfeited.body.meet.meetPhase).toBe('FORFEITED');
    expect(forfeited.body.status.leaderboard).toEqual([]);

    const stored = await prisma.gameAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    expect(stored.status).toBe('FORFEITED');
    expect(stored.score).toBe(0);
  });

  it('reserves ten meets per UTC day and then refuses the eleventh', async () => {
    const token = await signIn();

    for (let meet = 1; meet <= 10; meet += 1) {
      const res = await startMeet(token).expect(201);
      expect(res.body.meet.attemptNumber).toBe(meet);
    }

    await startMeet(token).expect(409);

    const counter = await prisma.gameDailyCounter.findFirstOrThrow({
      where: { gameId: 'voxora-pet-card-race' },
    });
    expect(counter.attemptCount).toBe(10);
  });
});
