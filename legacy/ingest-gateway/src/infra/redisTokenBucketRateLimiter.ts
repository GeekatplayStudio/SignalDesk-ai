import Redis from 'ioredis';
import { RateLimiter } from '../core/ports';

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refill_rate = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

if refill_rate <= 0 then
  return {0, 0}
end

local bucket = redis.call('HMGET', key, 'tokens', 'updated_at_ms')
local tokens = tonumber(bucket[1])
local updated_at_ms = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  updated_at_ms = now_ms
end

local elapsed_ms = math.max(0, now_ms - updated_at_ms)
local refill_tokens = elapsed_ms * (refill_rate / 1000)
tokens = math.min(capacity, tokens + refill_tokens)

local allowed = 0
if tokens >= requested then
  tokens = tokens - requested
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'updated_at_ms', now_ms)
local ttl_seconds = math.ceil((capacity / refill_rate) * 2)
redis.call('EXPIRE', key, ttl_seconds)

return {allowed, tokens}
`;

export class RedisTokenBucketRateLimiter implements RateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly capacity: number,
    private readonly refillRatePerSecond: number,
    private readonly keyPrefix = 'rate_limit',
  ) {}

  async consume(tenantId: string): Promise<boolean> {
    const key = `${this.keyPrefix}:${tenantId}`;
    const nowMs = Date.now();

    // Lua script is used so token refill + consume happen atomically under contention.
    const [allowed] = (await this.redis.eval(
      TOKEN_BUCKET_SCRIPT,
      1,
      key,
      nowMs,
      this.capacity,
      this.refillRatePerSecond,
      1,
    )) as [number | string, number | string];

    return Number(allowed) === 1;
  }
}
