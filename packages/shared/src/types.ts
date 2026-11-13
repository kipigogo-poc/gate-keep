/** Pure DTOs shared across the wire. Zero runtime logic. */

export type Uid = string;
export type EventId = string;
export type SeatId = string;

export type SeatTier = 'VIP' | 'LOWER_BOX' | 'UPPER_BOX' | 'GEN_AD';

/** An SVG element tagged by an organizer in the SeatMapper. */
export interface SeatTag {
  readonly svgElementId: string;
  readonly seatId: SeatId;
  readonly seatLabel: string;
  readonly tier: SeatTier;
  readonly priceCentavos: number;
}

export interface SeatLockRequestDto {
  readonly eventId: EventId;
  readonly seatId: SeatId;
}

export interface SeatLockResponseDto {
  readonly eventId: EventId;
  readonly seatId: SeatId;
  readonly expiresAt: string; // ISO-8601
}

export type TicketStatus = 'ISSUED' | 'ADMITTED' | 'REVOKED';

/** Firestore `tickets/{ticketId}` — written only by the Admin SDK. */
export interface TicketDoc {
  readonly ticketId: string;
  readonly eventId: EventId;
  readonly seatId: SeatId;
  readonly owner_uid: Uid;
  readonly status: TicketStatus;
  readonly issuedAt: string;
}

export type ScanVerdict = 'ADMIT' | 'REJECT_EXPIRED' | 'REJECT_INVALID' | 'REJECT_REUSED';

export interface ScanRequestDto {
  readonly ticketId: string;
  readonly code: string;
}

export interface ScanResponseDto {
  readonly verdict: ScanVerdict;
  readonly seatLabel?: string;
}

export interface ApiErrorDto {
  readonly statusCode: number;
  readonly message: string;
}
