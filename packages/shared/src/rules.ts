/** Business rules shared by the API (enforcement) and the PWA (display). */
export const SEAT_LOCK_TTL_SECONDS = 300;
export const TOTP_STEP_SECONDS = 15;
export const TOTP_DIGITS = 6;
/**
 * A code for time-step c is accepted only while the server clock is inside
 * [c*STEP - FUTURE_SKEW, (c+1)*STEP + GRACE). So a screenshot dies at most
 * STEP + GRACE seconds after it first appeared on the fan's phone.
 */
export const SCAN_GRACE_SECONDS = 2;
export const SCAN_FUTURE_SKEW_SECONDS = 2;
/** How far back a correct-but-old code is recognised as a screenshot (vs. garbage). */
export const SCREENSHOT_LOOKBACK_SECONDS = 60 * 60;
export const MAX_TICKETS_PER_EVENT_PER_PHONE = 2;
/** Seats one account may hold at once per event, so no single buyer can freeze a section. */
export const MAX_SEAT_HOLDS_PER_EVENT = 4;
/** Webhooks signed longer ago than this are treated as replays. */
export const WEBHOOK_TOLERANCE_SECONDS = 300;
