import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { defaultCommunicationAgreement } from '@voxora/contracts';
import { AppModule } from '../../dist/app.module';

describe('private communication preferences (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['preferences-a@example.com', 'preferences-b@example.com'] } },
    });
  });
  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });
  it('persists private communication preferences, validates input and resets only the caller', async () => {
    const server = app.getHttpServer();
    const register = async (email: string) =>
      (
        await request(server)
          .post('/v1/auth/register')
          .send({ email, password: 'secure-pass-123' })
          .expect(201)
      ).body;
    const first = await register('preferences-a@example.com');
    const second = await register('preferences-b@example.com');
    const firstAuth = `Bearer ${first.tokens.accessToken}`;
    const secondAuth = `Bearer ${second.tokens.accessToken}`;
    await request(server).get('/v1/settings/communication').expect(401);
    await request(server)
      .put('/v1/settings/communication')
      .send(defaultCommunicationAgreement)
      .expect(401);
    await request(server).delete('/v1/settings/communication').expect(401);
    const initial = await request(server)
      .get('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .expect(200);
    expect(initial.body).toEqual({ agreement: defaultCommunicationAgreement, saved: false });
    const custom = {
      ...defaultCommunicationAgreement,
      buddyName: 'Frikkie',
      personalBoundaries: ['Do not call me bro'],
    };
    await request(server)
      .put('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .send({ ...custom, userId: second.user.id })
      .expect(400);
    await request(server)
      .put('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .send({ ...custom, humour: 101 })
      .expect(400);
    await request(server)
      .put('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .send(custom)
      .expect(200);
    expect(
      (await prisma.userProfile.findUniqueOrThrow({ where: { userId: first.user.id } }))
        .communicationAgreement,
    ).toEqual(custom);
    const loaded = await request(server)
      .get('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .expect(200);
    expect(loaded.body).toEqual({ agreement: custom, saved: true });
    const other = await request(server)
      .get('/v1/settings/communication')
      .set('Authorization', secondAuth)
      .expect(200);
    expect(other.body).toEqual({ agreement: defaultCommunicationAgreement, saved: false });
    const secondCustom = { ...defaultCommunicationAgreement, buddyName: 'Other buddy' };
    await request(server)
      .put('/v1/settings/communication')
      .set('Authorization', secondAuth)
      .send(secondCustom)
      .expect(200);
    await request(server)
      .delete('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .expect(200);
    expect(
      (await prisma.userProfile.findUniqueOrThrow({ where: { userId: first.user.id } }))
        .communicationAgreement,
    ).toBeNull();
    expect(
      (
        await request(server)
          .get('/v1/settings/communication')
          .set('Authorization', secondAuth)
          .expect(200)
      ).body.agreement,
    ).toEqual(secondCustom);
    await request(server)
      .delete('/v1/settings/communication')
      .set('Authorization', firstAuth)
      .expect(200);
  });
});
