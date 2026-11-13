import type { EventId, SeatId, Uid } from '@gatekeep/shared';

/** Ids become Redis keys, so they are restricted to a safe alphabet. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// The {eventId} hash tag keeps a seat lock and a buyer's hold set in the same
// slot, so one Lua script may touch both on any Redis topology.
export function seatLockKey(eventId: EventId, seatId: SeatId): string {
  return `lock:{${eventId}}:seat:${seatId}`;
}

export function userHoldsKey(eventId: EventId, uid: Uid): string {
  return `holds:{${eventId}}:user:${uid}`;
}
