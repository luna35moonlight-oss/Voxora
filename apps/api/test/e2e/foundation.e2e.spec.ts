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
import { OWNER_BOOTSTRAP_COMPLETION_ID } from '../../dist/auth/crypto.util';

describe('Voxora API foundation (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const ownerEmail = 'luna35moonlight@gmail.com';
  const ownerPassword = 'secure-pass-123';
  const bootstrapToken = 'phase1-test-bootstrap-token';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_PORT = '3001';
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
    process.env.OWNER_BOOTSTRAP_EMAIL = ownerEmail;
    process.env.OWNER_BOOTSTRAP_TOKEN = bootstrapToken;

    await prisma.$connect();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
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
    await prisma.auditEvent.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationRecord.deleteMany();
    await prisma.mfaFactor.deleteMany();
    await prisma.roleAssignment.deleteMany();
    await prisma.authIdentity.deleteMany();
    await prisma.ownerBootstrapCompletion.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function registerOwnerCandidate() {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);
  }

  it('GET /v1/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('voxora-api');
  });

  it('registers, logs in, and reads /users/me with RBAC', async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = 'secure-pass-123';

    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(201);

    expect(register.body.user.email).toBe(email);
    expect(register.body.user.roles).toContain('USER');
    expect(register.body.tokens.accessToken).toBeTruthy();
    expect(register.body.user.emailVerified).toBe(false);

    const me = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${register.body.tokens.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(email);

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.tokens.refreshToken).toBeTruthy();

    const refresh = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: login.body.tokens.refreshToken })
      .expect(200);

    expect(refresh.body.tokens.accessToken).toBeTruthy();
  });

  describe('owner bootstrap (one-time)', () => {
    it('completes valid initial bootstrap and persists completion', async () => {
      await registerOwnerCandidate();

      const boot = await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken })
        .expect(200);

      expect(boot.body.status).toBe('owner_assigned');
      expect(boot.body.userId).toBeTruthy();
      expect(JSON.stringify(boot.body)).not.toContain(bootstrapToken);

      const completion = await prisma.ownerBootstrapCompletion.findUnique({
        where: { id: OWNER_BOOTSTRAP_COMPLETION_ID },
      });
      expect(completion?.ownerUserId).toBe(boot.body.userId);

      const login = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: ownerEmail, password: ownerPassword })
        .expect(200);
      expect(login.body.user.roles).toContain('OWNER');
      expect(JSON.stringify(login.body)).not.toContain(bootstrapToken);
    });

    it('rejects wrong email even with correct token', async () => {
      await registerOwnerCandidate();
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'other@example.com', password: ownerPassword })
        .expect(201);

      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: 'other@example.com', bootstrapToken })
        .expect(401);
    });

    it('rejects wrong token even if email matches', async () => {
      await registerOwnerCandidate();
      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken: 'wrong-token-wrong-token' })
        .expect(401);
    });

    it('rejects when bootstrap is not configured', async () => {
      const previous = process.env.OWNER_BOOTSTRAP_TOKEN;
      delete process.env.OWNER_BOOTSTRAP_TOKEN;
      await registerOwnerCandidate();
      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken })
        .expect(400);
      process.env.OWNER_BOOTSTRAP_TOKEN = previous;
    });

    it('rejects nonexistent registered user', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken })
        .expect(400);
    });

    it('rejects second bootstrap attempt after success', async () => {
      await registerOwnerCandidate();
      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken })
        .expect(200);

      const second = await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken })
        .expect(409);

      expect(second.body.message).toMatch(/already/i);
      expect(JSON.stringify(second.body)).not.toContain(bootstrapToken);

      const owners = await prisma.roleAssignment.count({
        where: { revokedAt: null, role: { name: 'OWNER' } },
      });
      expect(owners).toBe(1);
    });

    it('rejects bootstrap when an Owner assignment already exists', async () => {
      await registerOwnerCandidate();
      const user = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } });
      const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'OWNER' } });
      await prisma.roleAssignment.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
          assignedBy: 'test:preexisting',
        },
      });

      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken })
        .expect(409);

      const completion = await prisma.ownerBootstrapCompletion.findUnique({
        where: { id: OWNER_BOOTSTRAP_COMPLETION_ID },
      });
      expect(completion).toBeNull();
    });

    it('does not leak bootstrap secret in audit payloads', async () => {
      await registerOwnerCandidate();
      await request(app.getHttpServer())
        .post('/v1/auth/bootstrap-owner')
        .send({ email: ownerEmail, bootstrapToken: 'wrong-token-wrong-token' })
        .expect(401);

      const audits = await prisma.auditEvent.findMany({
        where: { action: { startsWith: 'owner.bootstrap' } },
      });
      expect(audits.length).toBeGreaterThan(0);
      for (const event of audits) {
        expect(JSON.stringify(event)).not.toContain(bootstrapToken);
        expect(JSON.stringify(event)).not.toContain('wrong-token-wrong-token');
      }
    });
  });

  it('does not expose fake Connected feature flags for Bondfire/pets', async () => {
    const res = await request(app.getHttpServer()).get('/v1/feature-flags').expect(200);
    const keys = res.body.map((f: { key: string; enabled: boolean }) => f.key);
    expect(keys).toContain('platform.foundation');
    expect(keys).not.toContain('bondfire.enabled');
    expect(keys).not.toContain('pets.enabled');
  });
});
