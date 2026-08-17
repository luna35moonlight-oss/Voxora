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

  function startMeet(token: string, championRacerId = 'moonlit-wolf') {
    return request(app.getHttpServer())
      .post('/v1/games/pet-card-race/meets/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ championRacerId });
  }

  /** A card that can legally be played on its own, plus the target a chaser needs. */
  function playableSingle(hand: Card[]): { cardIds: string[]; targetRacerId?: string } {
    const rankCard = hand.find((card) => card.type === 'RANK');
    if (rankCard) {
      return { cardIds: [rankCard.cardId] };
    }

    const card = hand[0];
    if (!card) {
      throw new Error('Empty hand');
    }

    return card.tactic === 'CHASER'
      ? { cardIds: [card.cardId], targetRacerId: 'shadow-panther' }
      : { cardIds: [card.cardId] };
  }

  it('reports an honest daily status with no reward rules', async () => {
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
    });
    expect(res.body.roster).toHaveLength(4);
  });

  it('rejects an unauthenticated meet', async () => {
    await request(app.getHttpServer())
      .post('/v1/games/pet-card-race/meets/start')
      .send({ championRacerId: 'moonlit-wolf' })
      .expect(401);
  });

  it('reserves a meet, deals the opening mix of eight cards, and keeps the deck server side', async () => {
    const token = await signIn();
    const res = await startMeet(token).expect(201);

    expect(res.body.meet).toMatchObject({
      attemptNumber: 1,
      meetPhase: 'RACING',
      raceNumber: 1,
      racesTotal: 3,
      meetScore: 0,
      usedRacerIds: ['moonlit-wolf'],
    });
    const hand = res.body.meet.currentRace.hand as Card[];
    expect(hand).toHaveLength(8);
    expect(hand.filter((card) => card.type === 'TACTIC')).toHaveLength(2);
    expect(res.body.meet.currentRace.stationsDealt).toBe(0);
    expect(res.body.meet.currentRace.cardsLeftToDeal).toBe(13);
    expect(res.body.meet.currentRace.lanes).toHaveLength(4);
    expect(res.body.status.attemptsUsedToday).toBe(1);

    // The draw pile, the rival schedule, and the shuffle seed must never reach the client.
    const payload = JSON.stringify(res.body);
    expect(payload).not.toContain('drawPile');
    expect(payload).not.toContain('rivalDeck');
    expect(payload).not.toContain('seed');
  });

  it('plays a card, holds the cooldown, and refuses cards that were never dealt', async () => {
    const token = await signIn();
    const started = await startMeet(token).expect(201);
    const attemptId = started.body.meet.attemptId as string;
    const hand = started.body.meet.currentRace.hand as Card[];

    await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/plays`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cardIds: ['not-a-dealt-card'] })
      .expect(400);

    const played = await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/plays`)
      .set('Authorization', `Bearer ${token}`)
      .send(playableSingle(hand))
      .expect(201);

    expect(played.body.meet.currentRace.hand).toHaveLength(7);
    expect(played.body.meet.currentRace.cooldownRemainingMs).toBeGreaterThan(0);

    const tooSoon = await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/plays`)
      .set('Authorization', `Bearer ${token}`)
      .send(playableSingle(played.body.meet.currentRace.hand as Card[]))
      .expect(409);
    expect(tooSoon.body.message).toMatch(/Wait \d+s/);

    const stored = await prisma.gameAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    const progress = stored.progressState as { currentRace: { hand: Card[] } };
    expect(progress.currentRace.hand).toHaveLength(7);
    expect(stored.score).toBeNull();
  });

  it('advances rivals on the server clock when the client syncs', async () => {
    const token = await signIn();
    const started = await startMeet(token).expect(201);
    const attemptId = started.body.meet.attemptId as string;

    await new Promise((resolve) => setTimeout(resolve, 3_200));

    const synced = await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/sync`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const lanes = synced.body.meet.currentRace.lanes as Array<{
      isChampion: boolean;
      step: number;
    }>;
    const rivalSteps = lanes
      .filter((lane) => !lane.isChampion)
      .reduce((total, lane) => total + lane.step, 0);

    expect(rivalSteps).toBeGreaterThan(0);
    expect(lanes.find((lane) => lane.isChampion)?.step).toBe(0);
  });

  it('keeps one player out of another player’s meet', async () => {
    const owner = await signIn();
    const intruder = await signIn();
    const started = await startMeet(owner).expect(201);
    const attemptId = started.body.meet.attemptId as string;

    await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/sync`)
      .set('Authorization', `Bearer ${intruder}`)
      .expect(403);
  });

  it('forfeits a meet with a zero score and no leaderboard entry', async () => {
    const token = await signIn();
    const started = await startMeet(token).expect(201);
    const attemptId = started.body.meet.attemptId as string;

    const forfeited = await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/forfeit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(forfeited.body.meet.meetPhase).toBe('FORFEITED');
    expect(forfeited.body.status.leaderboard).toEqual([]);
    expect(forfeited.body.status.bestScore).toBe(0);

    const stored = await prisma.gameAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    expect(stored.status).toBe('FORFEITED');
    expect(stored.score).toBe(0);

    await request(app.getHttpServer())
      .post(`/v1/games/pet-card-race/meets/${attemptId}/forfeit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });

  it('reserves ten meets per UTC day and then refuses the eleventh', async () => {
    const token = await signIn();

    for (let meet = 1; meet <= 10; meet += 1) {
      const res = await startMeet(token).expect(201);
      expect(res.body.meet.attemptNumber).toBe(meet);
    }

    await startMeet(token).expect(409);

    const status = await request(app.getHttpServer())
      .get('/v1/games/pet-card-race/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(status.body).toMatchObject({ attemptsUsedToday: 10, attemptsRemainingToday: 0 });

    const counter = await prisma.gameDailyCounter.findFirstOrThrow({
      where: { gameId: 'voxora-pet-card-race' },
    });
    expect(counter.attemptCount).toBe(10);
  });
});
