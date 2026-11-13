import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import type { Redis } from '@upstash/redis';
import { SEAT_LOCK_TTL_SECONDS } from '@gatekeep/shared';
import { AppModule } from '../src/app.module.js';
import { ID_TOKEN_VERIFIER, type IdTokenVerifier } from '../src/auth/auth.types.js';
import { REDIS } from '../src/redis/redis.tokens.js';
import { seatLockKey } from '../src/locks/lock-keys.js';

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/** Test tokens are "test-<uid>"; anything else is rejected like a bad Firebase token. */
const fakeVerifier: IdTokenVerifier = {
  verify: async (token) => {
    if (!token.startsWith('test-')) throw new Error('bad token');
    return { uid: token.slice('test-'.length) };
  },
};

describe.skipIf(!hasRedis)('Seat micro-locks (live Upstash)', () => {
  let app: INestApplication;
  let server: Server;
  let redis: Redis;
  const eventId = `test-${randomUUID()}`;
  const usedSeats: string[] = [];

  const lockUrl = (seatId: string): string => {
    usedSeats.push(seatId);
    return `/events/${eventId}/seats/${seatId}/lock`;
  };
  const as = (uid: string): string => `Bearer test-${uid}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ID_TOKEN_VERIFIER)
      .useValue(fakeVerifier)
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    server = app.getHttpServer() as Server;
    redis = app.get<Redis>(REDIS);
  });

  afterAll(async () => {
    const keys = [...new Set(usedSeats)].map((s) => seatLockKey(eventId, s));
    if (keys.length) await redis.del(...keys);
    await app.close();
  });

  it('TC-03: 50 simultaneous clicks on one seat → exactly 1×200 and 49×409', async () => {
    const url = lockUrl('A1');
    const responses = await Promise.all(
      Array.from({ length: 50 }, (_, i) => request(server).post(url).set('Authorization', as(`fan-${i}`))),
    );
    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(49);

    const winner = responses.findIndex((r) => r.status === 200);
    expect(await redis.get(seatLockKey(eventId, 'A1'))).toBe(`fan-${winner}`);
    const pttl = await redis.pttl(seatLockKey(eventId, 'A1'));
    expect(pttl).toBeGreaterThan((SEAT_LOCK_TTL_SECONDS - 10) * 1000);
    expect(pttl).toBeLessThanOrEqual(SEAT_LOCK_TTL_SECONDS * 1000);
  });

  it('a repeat click by the holder is 200 but never extends the hold', async () => {
    const url = lockUrl('A2');
    const first = await request(server).post(url).set('Authorization', as('alice')).expect(200);
    await new Promise((r) => setTimeout(r, 1100));
    const again = await request(server).post(url).set('Authorization', as('alice')).expect(200);
    expect(Date.parse(again.body.expiresAt)).toBeLessThanOrEqual(Date.parse(first.body.expiresAt) + 250);
  });

  it('only the holder can release; then the seat is free again', async () => {
    const url = lockUrl('A3');
    await request(server).post(url).set('Authorization', as('alice')).expect(200);

    await request(server).delete(url).set('Authorization', as('mallory')).expect(204);
    await request(server).post(url).set('Authorization', as('bob')).expect(409);

    await request(server).delete(url).set('Authorization', as('alice')).expect(204);
    await request(server).post(url).set('Authorization', as('bob')).expect(200);
  });

  it('409 does not leak who holds the seat', async () => {
    const url = lockUrl('A4');
    await request(server).post(url).set('Authorization', as('alice-secret-uid')).expect(200);
    const res = await request(server).post(url).set('Authorization', as('bob')).expect(409);
    expect(JSON.stringify(res.body)).not.toContain('alice-secret-uid');
  });

  it('rejects missing or invalid tokens with 401', async () => {
    await request(server).post(`/events/${eventId}/seats/A5/lock`).expect(401);
    await request(server).post(`/events/${eventId}/seats/A5/lock`).set('Authorization', 'Bearer forged').expect(401);
  });

  it('rejects ids that could break out of the key namespace with 400', async () => {
    await request(server).post(`/events/${eventId}/seats/A1:x/lock`).set('Authorization', as('alice')).expect(400);
    await request(server).post(`/events/${'x'.repeat(65)}/seats/A1/lock`).set('Authorization', as('alice')).expect(400);
  });
});
