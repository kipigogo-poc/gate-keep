import type { EventId, SeatId } from '@gatekeep/shared';

/** Ids become Redis keys, so they are restricted to a safe alphabet. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function seatLockKey(eventId: EventId, seatId: SeatId): string {
  return `lock:event:${eventId}:seat:${seatId}`;
}
