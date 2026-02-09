import Redis from 'ioredis';
import { QueueClient } from '../core/ports';
import { QueueEventEnvelope } from '../core/types';

export class RedisQueueClient implements QueueClient {
  constructor(
    private readonly redis: Redis,
    private readonly queueKey: string,
    private readonly dlqKey: string,
  ) {}

  async push(envelope: QueueEventEnvelope): Promise<void> {
    await this.redis.rpush(this.queueKey, JSON.stringify(envelope));
  }

  async pop(blockMs: number): Promise<QueueEventEnvelope | null> {
    const blockSeconds = Math.max(1, Math.ceil(blockMs / 1000));
    const result = await this.redis.blpop(this.queueKey, blockSeconds);

    if (!result || result.length < 2) {
      return null;
    }

    return JSON.parse(result[1]) as QueueEventEnvelope;
  }

  async pushDlq(payload: Record<string, unknown>): Promise<void> {
    await this.redis.rpush(this.dlqKey, JSON.stringify(payload));
  }
}
