import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { Redis } from '@upstash/redis';
import { SEAT_LOCK_TTL_SECONDS, type EventId, type SeatId, type SeatLockResponseDto, type Uid } from '@gatekeep/shared';
import { REDIS } from '../redis/redis.tokens.js';
import { seatLockKey } from './lock-keys.js';
import { ACQUIRE_SEAT_LOCK, RELEASE_SEAT_LOCK } from './seat-lock.scripts.js';

type AcquireReply = [held: number, pttlMs: number];

@Injectable()
export class SeatLocksService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /** Holds the seat for SEAT_LOCK_TTL_SECONDS, or throws 409 if another buyer has it. */
  async acquire(eventId: EventId, seatId: SeatId, uid: Uid): Promise<SeatLockResponseDto> {
    const [held, pttlMs] = await this.redis.eval<[Uid, string], AcquireReply>(
      ACQUIRE_SEAT_LOCK,
      [seatLockKey(eventId, seatId)],
      [uid, String(SEAT_LOCK_TTL_SECONDS)],
    );
    if (Number(held) !== 1) {
      throw new ConflictException('Seat is being held by another buyer');
    }
    return { eventId, seatId, expiresAt: new Date(Date.now() + Number(pttlMs)).toISOString() };
  }

  /** Releases the hold if the caller owns it. Returns whether anything was released. */
  async release(eventId: EventId, seatId: SeatId, uid: Uid): Promise<boolean> {
    const deleted = await this.redis.eval<[Uid], number>(RELEASE_SEAT_LOCK, [seatLockKey(eventId, seatId)], [uid]);
    return Number(deleted) === 1;
  }
}
