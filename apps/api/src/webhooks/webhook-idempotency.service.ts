import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from '@upstash/redis';
import { REDIS } from '../redis/redis.tokens.js';

/** PayMongo retries for up to days; remember processed ids comfortably longer. */
const PROCESSED_TTL_SECONDS = 14 * 24 * 60 * 60;

const key = (eventId: string): string => `webhook:paymongo:${eventId}`;

@Injectable()
export class WebhookIdempotencyService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /** Atomically claims the event. False means it was already received. */
  async claim(eventId: string): Promise<boolean> {
    return (await this.redis.set(key(eventId), '1', { nx: true, ex: PROCESSED_TTL_SECONDS })) === 'OK';
  }

  /** Un-claims after a processing failure so PayMongo's retry is handled. */
  async release(eventId: string): Promise<void> {
    await this.redis.del(key(eventId));
  }
}
