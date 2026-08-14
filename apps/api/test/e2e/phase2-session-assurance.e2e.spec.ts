import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';
import { AppModule } from '../../dist/app.module';
import { AllExceptionsFilter } from '../../dist/common/all-exceptions.filter';
import { correlationMiddleware } from '../../dist/common/correlation.middleware';

function hotpFromBase32(secretBase32: string, counter: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = secretBase32.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const secret = Buffer.from(bytes);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(buf).digest();
  const offset = digest[digest.length - 1]! & 0xf;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

describe('Phase 2 closeout — privileged session MFA assurance', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const ownerEmail = 'luna35moonlight@gmail.com';
  const ownerPassword = 'secure-pass-123';
  const bootstrapToken = 'phase2-assurance-bootstrap-token';

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
    process.env.EMAIL_PROVIDER = 'dev';
    process.env.PHONE_PROVIDER = 'dev';
    process.env.MFA_ENCRYPTION_KEY = 'test-mfa-encryption-key-min-32-chars!!';

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
    await prisma.mfaChallenge.deleteMany();
    await prisma.mfaFactor.deleteMany();
    await prisma.devDeliveryArtifact.deleteMany();
    await prisma.providerInterest.deleteMany();
    await prisma.consentRecord.deleteMany();
    await prisma.purchaseReference.deleteMany();
    await prisma.subscriptionEvent.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.userEntitlement.deleteMany();
    await prisma.trialGrant.deleteMany();
    await prisma.onboardingState.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.roleAssignment.deleteMany();
    await prisma.authIdentity.deleteMany();
    await prisma.ownerBootstrapCompletion.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function enrollAndAuthenticateOwner(preRegisteredRefresh?: string) {
    if (!preRegisteredRefresh) {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: ownerEmail, password: ownerPassword })
        .expect(201);
    }

    const boot = await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email: ownerEmail, bootstrapToken })
      .expect(200);
    expect(boot.body.tokens).toBeUndefined();
    expect(boot.body.accessToken).toBeUndefined();

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(200);
    expect(login.body.status).toBe('mfa_enrollment_required');

    const enrollStart = await request(app.getHttpServer())
      .post('/v1/mfa/enroll/start')
      .send({ enrollmentToken: login.body.enrollmentToken })
      .expect(200);

    const step = Math.floor(Date.now() / 1000 / 30);
    const enrollCode = hotpFromBase32(enrollStart.body.secret, step);
    await request(app.getHttpServer())
      .post('/v1/mfa/enroll/confirm')
      .send({ enrollmentToken: login.body.enrollmentToken, code: enrollCode })
      .expect(200);

    const login2 = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(200);
    expect(login2.body.status).toBe('mfa_required');

    const challengeCode = hotpFromBase32(
      enrollStart.body.secret,
      Math.floor(Date.now() / 1000 / 30) + 1,
    );
    const authed = await request(app.getHttpServer())
      .post('/v1/mfa/challenge/verify')
      .send({ challengeToken: login2.body.challengeToken, code: challengeCode })
      .expect(200);

    return {
      secret: enrollStart.body.secret as string,
      session: authed.body,
    };
  }

  it('Test A — normal USER refresh succeeds', async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = 'secure-pass-123';
    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(201);

    expect(register.body.user.authenticationAssurance).toBe('PASSWORD');
    expect(register.body.user.roles).toEqual(['USER']);

    const refreshed = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: register.body.tokens.refreshToken })
      .expect(200);

    expect(refreshed.body.status).toBe('authenticated');
    expect(refreshed.body.user.roles).toContain('USER');
    expect(refreshed.body.tokens.accessToken).toBeTruthy();
  });

  it('Test B — privileged login without MFA does not receive privileged session', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);
    await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email: ownerEmail, bootstrapToken })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(200);

    expect(login.body.status).toBe('mfa_enrollment_required');
    expect(login.body.tokens).toBeUndefined();
    expect(login.body.user).toBeUndefined();
  });

  it('Test C — successful MFA challenge produces MFA-assured privileged session', async () => {
    const { session } = await enrollAndAuthenticateOwner();
    expect(session.user.roles).toContain('OWNER');
    expect(session.user.authenticationAssurance).toBe('MFA');

    const dbSession = await prisma.session.findFirst({
      where: { userId: session.user.id, revokedAt: null },
    });
    expect(dbSession?.authenticationAssurance).toBe('MFA');
    expect(dbSession?.mfaVerifiedAt).toBeTruthy();
  });

  it('Test D — ordinary pre-Owner refresh cannot elevate to OWNER', async () => {
    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);
    const ordinaryRefresh = register.body.tokens.refreshToken as string;

    await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email: ownerEmail, bootstrapToken })
      .expect(200);

    // Bootstrap revokes pre-Owner sessions → refresh rejected (cannot elevate).
    const rejected = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: ordinaryRefresh })
      .expect(401);

    expect(String(rejected.body.message)).toMatch(/Invalid refresh token|MFA|re-authentication/i);
    expect(rejected.body.tokens).toBeUndefined();
    expect(rejected.body.user).toBeUndefined();

    // Defense-in-depth: a lingering PASSWORD-assured session under OWNER also cannot refresh.
    const user = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } });
    const { createHash, randomBytes } = await import('crypto');
    const raw = randomBytes(48).toString('base64url');
    const hash = createHash('sha256').update(raw).digest('hex');
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hash,
        expiresAt: new Date(Date.now() + 86_400_000),
        authenticationAssurance: 'PASSWORD',
        mfaVerifiedAt: null,
      },
    });

    const mfaRequired = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: raw })
      .expect(401);
    expect(String(mfaRequired.body.message)).toMatch(/MFA|re-authentication/i);
  });

  it('Test E — Owner bootstrap revokes pre-bootstrap sessions', async () => {
    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);
    const userId = register.body.user.id as string;

    const before = await prisma.session.count({
      where: { userId, revokedAt: null },
    });
    expect(before).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email: ownerEmail, bootstrapToken })
      .expect(200);

    const after = await prisma.session.count({
      where: { userId, revokedAt: null },
    });
    expect(after).toBe(0);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: register.body.tokens.refreshToken })
      .expect(401);
  });

  it('Test F — MFA-assured Owner refresh rotates and remains MFA-assured', async () => {
    const { session } = await enrollAndAuthenticateOwner();

    const refreshed = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: session.tokens.refreshToken })
      .expect(200);

    expect(refreshed.body.status).toBe('authenticated');
    expect(refreshed.body.user.roles).toContain('OWNER');
    expect(refreshed.body.user.authenticationAssurance).toBe('MFA');

    const dbSession = await prisma.session.findFirst({
      where: { userId: session.user.id, revokedAt: null },
    });
    expect(dbSession?.authenticationAssurance).toBe('MFA');
    expect(dbSession?.mfaVerifiedAt).toBeTruthy();

    // Previous refresh token is rotated away
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: session.tokens.refreshToken })
      .expect(401);
  });

  it('Test G — MFA reset invalidates privileged sessions', async () => {
    const { session, secret } = await enrollAndAuthenticateOwner();
    const refreshToken = session.tokens.refreshToken as string;
    const accessToken = session.tokens.accessToken as string;

    // Challenge used step+1; current step remains valid for self-reset in the same window.
    const step = Math.floor(Date.now() / 1000 / 30);
    const resetCode = hotpFromBase32(secret, step);

    await request(app.getHttpServer())
      .post('/v1/mfa/reset')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentCode: resetCode })
      .expect(200);

    const active = await prisma.session.count({
      where: { userId: session.user.id, revokedAt: null },
    });
    expect(active).toBe(0);

    await request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }).expect(401);

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(200);
    expect(login.body.status).toBe('mfa_enrollment_required');
    expect(login.body.tokens).toBeUndefined();
  });

  it('Test H — client-provided MFA assurance fields cannot forge privileged refresh', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);
    await request(app.getHttpServer())
      .post('/v1/auth/bootstrap-owner')
      .send({ email: ownerEmail, bootstrapToken })
      .expect(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } });
    const { createHash, randomBytes } = await import('crypto');
    const raw = randomBytes(48).toString('base64url');
    const hash = createHash('sha256').update(raw).digest('hex');
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hash,
        expiresAt: new Date(Date.now() + 86_400_000),
        authenticationAssurance: 'PASSWORD',
        mfaVerifiedAt: null,
      },
    });

    // Extra client fields must be ignored; only server Session assurance matters.
    const forged = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({
        refreshToken: raw,
        mfaVerifiedAt: new Date().toISOString(),
        authenticationAssurance: 'MFA',
        mfaAssured: true,
        authLevel: 'mfa',
      })
      .expect(401);

    expect(String(forged.body.message)).toMatch(/MFA|re-authentication/i);

    const mfaSessions = await prisma.session.count({
      where: {
        userId: user.id,
        revokedAt: null,
        authenticationAssurance: 'MFA',
      },
    });
    expect(mfaSessions).toBe(0);
  });

  it('confirms sole privileged human policy — Owner only, no ADMIN assignment', async () => {
    await enrollAndAuthenticateOwner();
    const user = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } });
    const roles = await prisma.roleAssignment.findMany({
      where: { userId: user.id, revokedAt: null },
      include: { role: true },
    });
    const names = roles.map((r) => r.role.name).sort();
    expect(names).toContain('OWNER');
    expect(names).toContain('USER');
    expect(names).not.toContain('ADMIN');
    expect(names).not.toContain('MODERATOR');
    expect(names).not.toContain('SUPPORT');
  });
});
