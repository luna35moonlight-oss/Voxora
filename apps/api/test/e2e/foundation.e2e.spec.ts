import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../dist/app.module';
import { AllExceptionsFilter } from '../../dist/common/all-exceptions.filter';
import { correlationMiddleware } from '../../dist/common/correlation.middleware';

describe('Voxora API foundation (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

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
    process.env.OWNER_BOOTSTRAP_EMAIL = 'luna35moonlight@gmail.com';
    process.env.OWNER_BOOTSTRAP_TOKEN = 'phase1-test-bootstrap-token';

    await prisma.$connect();
    await prisma.auditEvent.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationRecord.deleteMany();
    await prisma.mfaFactor.deleteMany();
    await prisma.roleAssignment.deleteMany();
    await prisma.authIdentity.deleteMany();
    await prisma.user.deleteMany();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(helmet());
    app.use(correlationMiddleware);
    app.setGlobalPrefix('v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

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

  it('rejects owner bootstrap without token even if email matches', async () => {
    const email = 'luna35moonlight@gmail.com';
    const password = 'secure-pass-123';

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password })
      .expect((res) => {
        if (![201, 409].includes(res.status)) {
          throw new Error(`Unexpected status ${res.status}`);
        }
      });

    await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email, bootstrapToken: 'wrong-token-wrong-token' })
      .expect(401);
  });

  it('assigns owner only with configured bootstrap token', async () => {
    const email = 'luna35moonlight@gmail.com';
    const password = 'secure-pass-123';
    const bootstrapToken = process.env.OWNER_BOOTSTRAP_TOKEN;
    expect(bootstrapToken && bootstrapToken.length >= 16).toBe(true);

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password })
      .expect((res) => {
        if (![201, 409].includes(res.status)) {
          throw new Error(`Unexpected status ${res.status}`);
        }
      });

    const boot = await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email, bootstrapToken })
      .expect(200);

    expect(boot.body.status).toBe('owner_assigned');

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.user.roles).toContain('OWNER');
  });

  it('does not expose fake Connected feature flags for Bondfire/pets', async () => {
    const res = await request(app.getHttpServer()).get('/v1/feature-flags').expect(200);
    const keys = res.body.map((f: { key: string; enabled: boolean }) => f.key);
    expect(keys).toContain('platform.foundation');
    expect(keys).not.toContain('bondfire.enabled');
    expect(keys).not.toContain('pets.enabled');
  });
});
