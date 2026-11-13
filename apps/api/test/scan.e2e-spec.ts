import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import type { Redis } from '@upstash/redis';
import { SCAN_GRACE_SECONDS, TOTP_STEP_SECONDS, encodeQrPayload, hotp, importTotpKey, timeStep } from '@gatekeep/shared';
import { AppModule } from '../src/app.module.js';
import { ID_TOKEN_VERIFIER, type IdTokenVerifier } from '../src/auth/auth.types.js';
import { CLOCK } from '../src/common/clock.js';
import { REDIS } from '../src/redis/redis.tokens.js';
import { TICKET_SECRETS, type TicketSecretsRepository } from '../src/scan/ticket-secrets.repository.js';

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const verifier: IdTokenVerifier = {
  verify: async (token) => {
    if (token === 'staff') return { uid: 'gate-1', roles: ['door_staff'] };
    if (token === 'staff2') return { uid: 'gate-2', roles: ['door_staff'] };
    if (token === 'fan') return { uid: 'fan-1', roles: [] };
    throw new Error('bad token');
  },
};

describe.skipIf(!hasRedis)('Gate scanning (live Upstash)', () => {
  let app: INestApplication;
  let server: Server;
  let redis: Redis;
  let now = Date.UTC(2026, 11, 1, 19, 0, 0);
  const seeds = new Map<string, Uint8Array<ArrayBuffer>>();
  const secrets: TicketSecretsRepository = { findSeed: async (id) => seeds.get(id) ?? null };

  const newTicket = (): string => {
    const id = `tkt_${randomBytes(6).toString('hex')}`;
    seeds.set(id, new Uint8Array(randomBytes(32)));
    return id;
  };
  /** What the fan's phone shows at `atMs`. */
  const walletQr = async (ticketId: string, atMs: number): Promise<string> =>
    encodeQrPayload(ticketId, await hotp(await importTotpKey(seeds.get(ticketId)!), timeStep(atMs)));
  const scan = (payload: string, token = 'staff') =>
    request(server).post('/scan').set('Authorization', `Bearer ${token}`).send({ payload });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ID_TOKEN_VERIFIER)
      .useValue(verifier)
      .overrideProvider(TICKET_SECRETS)
      .useValue(secrets)
      .overrideProvider(CLOCK)
      .useValue(() => now)
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    server = app.getHttpServer() as Server;
    redis = app.get<Redis>(REDIS);
  });

  afterAll(async () => {
    if (seeds.size) await redis.del(...[...seeds.keys()].map((id) => `admitted:${id}`));
    await app.close();
  });

  it('admits a live wallet code', async () => {
    const t = newTicket();
    expect((await scan(await walletQr(t, now)).expect(200)).body).toEqual({ verdict: 'ADMIT' });
  });

  it('TC-01: a screenshot scanned 15 s + grace after it appeared is REJECT_EXPIRED', async () => {
    const t = newTicket();
    const stepStart = timeStep(now) * TOTP_STEP_SECONDS * 1000;
    const screenshot = await walletQr(t, stepStart);
    now = stepStart + (TOTP_STEP_SECONDS + SCAN_GRACE_SECONDS) * 1000;
    expect((await scan(screenshot).expect(200)).body).toEqual({ verdict: 'REJECT_EXPIRED' });
    // The real phone, showing the current code, still gets in.
    expect((await scan(await walletQr(t, now)).expect(200)).body).toEqual({ verdict: 'ADMIT' });
  });

  it('a ticket enters once: a second scan, even with a fresh code, is REJECT_REUSED', async () => {
    const t = newTicket();
    await scan(await walletQr(t, now)).expect(200);
    now += 20_000;
    expect((await scan(await walletQr(t, now)).expect(200)).body).toEqual({ verdict: 'REJECT_REUSED' });
  });

  it('two gates scanning the same code at once → exactly one ADMIT', async () => {
    const t = newTicket();
    const qr = await walletQr(t, now);
    const results = await Promise.all([scan(qr, 'staff'), scan(qr, 'staff2'), scan(qr, 'staff'), scan(qr, 'staff2')]);
    const verdicts = results.map((r) => r.body.verdict);
    expect(verdicts.filter((v) => v === 'ADMIT')).toHaveLength(1);
    expect(verdicts.filter((v) => v === 'REJECT_REUSED')).toHaveLength(3);
  });

  it('unknown tickets, wrong codes and garbage are REJECT_INVALID', async () => {
    const t = newTicket();
    expect((await scan(encodeQrPayload('tkt_unknown', '123456')).expect(200)).body.verdict).toBe('REJECT_INVALID');
    const good = await walletQr(t, now);
    const bad = good.slice(0, -1) + String((Number(good.at(-1)) + 1) % 10);
    expect((await scan(bad).expect(200)).body.verdict).toBe('REJECT_INVALID');
    expect((await scan('https://evil.example/qr').expect(200)).body.verdict).toBe('REJECT_INVALID');
  });

  it('only door staff can scan', async () => {
    await scan(encodeQrPayload('tkt_x', '123456'), 'fan').expect(403);
    await request(server).post('/scan').send({ payload: 'x' }).expect(401);
  });

  it('rejects a missing payload with 400', async () => {
    await request(server).post('/scan').set('Authorization', 'Bearer staff').send({}).expect(400);
  });
});
