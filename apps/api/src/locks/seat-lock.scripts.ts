/**
 * Atomic Lua scripts — the whole check-and-set runs inside Redis, so there is
 * no window between "is it free?" and "take it" for a second buyer to slip in.
 */

/**
 * KEYS[1] lock key · ARGV[1] uid · ARGV[2] ttl seconds
 * Returns {1, pttl} when the caller holds the lock (new or already theirs),
 * {0, pttl} when someone else does. A repeat click never extends the hold.
 */
export const ACQUIRE_SEAT_LOCK = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', ARGV[2]) then
  return {1, tonumber(ARGV[2]) * 1000}
end
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return {1, redis.call('PTTL', KEYS[1])}
end
return {0, redis.call('PTTL', KEYS[1])}
`;

/** KEYS[1] lock key · ARGV[1] uid. Deletes only if the caller is the holder. */
export const RELEASE_SEAT_LOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;
