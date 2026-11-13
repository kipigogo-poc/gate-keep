import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import type { Redis } from '@upstash/redis';
import { computeSignature } from '../src/webhooks/paymongo-signature.js';
import { PAYMENT_EVENT_HANDLER, type PaymentEventHandler } from '../src/webhooks/payment-events.handler.js';
import { REDIS } from '../src/redis/redis.tokens.js';

const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const SECRET = `whsk_test_${randomBytes(16).toString('hex')}`;
const URL_PATH = '/webhooks/paymongo';

function eventBody(eventId: string): string {
  return JSON.stringify({
    data: {
      id: eventId,
      type: 'event',
      attributes: { type: 'checkout_session.payment.paid', livemode: false, data: { id: 'cs_test_1' } },
    },
  });
}

function sign(body: string, opts: { secret?: string; t?: number; field?: 'te' | 'li' } = {}): string {
  const t = opts.t ?? Math.floor(Date.now() / 1000);
  const sig = computeSignature(opts.secret ?? SECRET, t, Buffer.from(body));
  return `t=${t},${opts.field ?? 'te'}=${sig}`;
}

describe.skipIf(!hasRedis)('TC-04: PayMongo webhook integrity (live Upstash)', () => {
  let app: INestApplication;
  let server: Server;
  let redis: Redis;
  const handled = vi.fn<PaymentEventHandler['handle']>(async () => undefined);
  const seenIds: string[] = [];
  const newEventId = (): string => {
    const id = `evt_test${randomBytes(8).toString('hex')}`;
    seenIds.push(id);
    return id;
  };
  const post = (body: string, signature?: string) => {
    const req = request(server).post(URL_PATH).set('Content-Type', 'application/json');
    return (signature ? req.set('Paymongo-Signature', signature) : req).send(body);
  };

  beforeAll(async () => {
    // Set before AppModule is evaluated so ConfigModule picks it up.
    process.env.PAYMONGO_WEBHOOK_SECRET = SECRET;
    process.env.PAYMONGO_SECRET_KEY = '';
    const { AppModule } = await import('../src/app.module.js');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PAYMENT_EVENT_HANDLER)
      .useValue({ handle: handled } satisfies PaymentEventHandler)
      .compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    await app.listen(0);
    server = app.getHttpServer() as Server;
    redis = app.get<Redis>(REDIS);
  });

  beforeEach(() => handled.mockClear());

  afterAll(async () => {
    if (seenIds.length) await redis.del(...seenIds.map((id) => `webhook:paymongo:${id}`));
    await app.close();
  });

  it('accepts a genuinely signed event and hands it to the handler once', async () => {
    const body = eventBody(newEventId());
    const res = await post(body, sign(body)).expect(200);
    expect(res.body).toEqual({ received: true, duplicate: false });
    expect(handled).toHaveBeenCalledTimes(1);
  });

  it('drops a forged signature with 401 and never reaches the handler', async () => {
    const body = eventBody(newEventId());
    await post(body, sign(body, { secret: 'attacker-guess' })).expect(401);
    expect(handled).not.toHaveBeenCalled();
  });

  it('drops a request with no signature header', async () => {
    await post(eventBody(newEventId())).expect(401);
    expect(handled).not.toHaveBeenCalled();
  });

  it('drops a body altered after signing (e.g. amount or id swapped)', async () => {
    const signedBody = eventBody(newEventId());
    await post(eventBody(newEventId()), sign(signedBody)).expect(401);
    expect(handled).not.toHaveBeenCalled();
  });

  it('drops a captured request replayed after the tolerance window', async () => {
    const body = eventBody(newEventId());
    await post(body, sign(body, { t: Math.floor(Date.now() / 1000) - 600 })).expect(401);
    expect(handled).not.toHaveBeenCalled();
  });

  it('drops a live-mode signature while running in test mode', async () => {
    const body = eventBody(newEventId());
    await post(body, sign(body, { field: 'li' })).expect(401);
  });

  it('processes a re-delivered event id only once', async () => {
    const body = eventBody(newEventId());
    await post(body, sign(body)).expect(200);
    const again = await post(body, sign(body)).expect(200);
    expect(again.body).toEqual({ received: true, duplicate: true });
    expect(handled).toHaveBeenCalledTimes(1);
  });

  it('un-claims the event when the handler fails, so the retry succeeds', async () => {
    const body = eventBody(newEventId());
    handled.mockRejectedValueOnce(new Error('firestore down'));
    await post(body, sign(body)).expect(500);
    await post(body, sign(body)).expect(200);
    expect(handled).toHaveBeenCalledTimes(2);
  });

  it('rejects a correctly signed but malformed payload with 400', async () => {
    const body = JSON.stringify({ hello: 'world' });
    await post(body, sign(body)).expect(400);
    expect(handled).not.toHaveBeenCalled();
  });
});
