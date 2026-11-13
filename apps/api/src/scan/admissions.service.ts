import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from '@upstash/redis';
import { REDIS } from '../redis/redis.tokens.js';

const ADMISSION_TTL_SECONDS = 3 * 24 * 60 * 60;

@Injectable()
export class AdmissionsService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /** Atomic first-scan-wins across every gate. False means the ticket already entered. */
  async admitOnce(ticketId: string, gateUid: string): Promise<boolean> {
    const res = await this.redis.set(`admitted:${ticketId}`, gateUid, { nx: true, ex: ADMISSION_TTL_SECONDS });
    return res === 'OK';
  }
}
