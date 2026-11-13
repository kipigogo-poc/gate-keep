/** Business rules shared by the API (enforcement) and the PWA (display). */
export const SEAT_LOCK_TTL_SECONDS = 300;
export const TOTP_STEP_SECONDS = 15;
export const TOTP_DIGITS = 6;
/** Steps of clock drift tolerated either side of the server clock. */
export const TOTP_DRIFT_WINDOW = 1;
export const MAX_TICKETS_PER_EVENT_PER_PHONE = 2;
/** Seats one account may hold at once per event, so no single buyer can freeze a section. */
export const MAX_SEAT_HOLDS_PER_EVENT = 4;
/** Webhooks signed longer ago than this are treated as replays. */
export const WEBHOOK_TOLERANCE_SECONDS = 300;
