/**
 * Atomic Lua scripts — every check-and-set runs inside Redis, so there is no
 * window between "is it free?" and "take it" for a second buyer to slip in.
 */

/**
 * KEYS[1] seat lock · KEYS[2] buyer's hold set (zset: seatId -> expiry ms)
 * ARGV[1] uid · ARGV[2] seatId · ARGV[3] ttl seconds · ARGV[4] max holds
 *
 * Returns { 1, pttl}  caller holds the seat (new, or already theirs — never extended)
 *         { 0, pttl}  another buyer holds it
 *         {-1, 0}     caller is at the hold cap
 */
export const ACQUIRE_SEAT_LOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return {1, redis.call('PTTL', KEYS[1])}
end

local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local ttlMs = tonumber(ARGV[3]) * 1000

redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now)
if redis.call('ZCARD', KEYS[2]) >= tonumber(ARGV[4]) then
  return {-1, 0}
end

if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', ARGV[3]) then
  redis.call('ZADD', KEYS[2], now + ttlMs, ARGV[2])
  redis.call('PEXPIRE', KEYS[2], ttlMs)
  return {1, ttlMs}
end
return {0, redis.call('PTTL', KEYS[1])}
`;

/** KEYS[1] seat lock · KEYS[2] hold set · ARGV[1] uid · ARGV[2] seatId. Holder-only delete. */
export const RELEASE_SEAT_LOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('ZREM', KEYS[2], ARGV[2])
  return redis.call('DEL', KEYS[1])
end
return 0
`;
