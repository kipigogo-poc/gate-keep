import { ConflictException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Redis } from '@upstash/redis';
import {
  MAX_SEAT_HOLDS_PER_EVENT,
  SEAT_LOCK_TTL_SECONDS,
  type EventId,
  type SeatId,
  type SeatLockResponseDto,
  type Uid,
} from '@gatekeep/shared';
import { REDIS } from '../redis/redis.tokens.js';
import { seatLockKey, userHoldsKey } from './lock-keys.js';
import { ACQUIRE_SEAT_LOCK, RELEASE_SEAT_LOCK } from './seat-lock.scripts.js';

type AcquireReply = [status: number, pttlMs: number];

@Injectable()
export class SeatLocksService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /** Holds the seat for SEAT_LOCK_TTL_SECONDS. 409 if taken, 429 if the buyer is at the hold cap. */
  async acquire(eventId: EventId, seatId: SeatId, uid: Uid): Promise<SeatLockResponseDto> {
    const [status, pttlMs] = await this.redis.eval<[Uid, SeatId, string, string], AcquireReply>(
      ACQUIRE_SEAT_LOCK,
      [seatLockKey(eventId, seatId), userHoldsKey(eventId, uid)],
      [uid, seatId, String(SEAT_LOCK_TTL_SECONDS), String(MAX_SEAT_HOLDS_PER_EVENT)],
    );
    switch (Number(status)) {
      case 1:
        return { eventId, seatId, expiresAt: new Date(Date.now() + Number(pttlMs)).toISOString() };
      case -1:
        throw new HttpException(
          `You can hold at most ${MAX_SEAT_HOLDS_PER_EVENT} seats at a time`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      default:
        throw new ConflictException('Seat is being held by another buyer');
    }
  }

  /** Releases the hold if the caller owns it. Returns whether anything was released. */
  async release(eventId: EventId, seatId: SeatId, uid: Uid): Promise<boolean> {
    const deleted = await this.redis.eval<[Uid, SeatId], number>(
      RELEASE_SEAT_LOCK,
      [seatLockKey(eventId, seatId), userHoldsKey(eventId, uid)],
      [uid, seatId],
    );
    return Number(deleted) === 1;
  }
}
