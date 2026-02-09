import {
  ConversationEventRepository,
  IdempotencyStore,
  QueueClient,
  RateLimiter,
} from '../core/ports';
import { QueueEventEnvelope } from '../core/types';

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly keys = new Map<string, number>();

  async exists(key: string): Promise<boolean> {
    this.cleanup();
    return this.keys.has(key);
  }

  async claim(key: string, ttlSeconds: number): Promise<boolean> {
    this.cleanup();

    if (this.keys.has(key)) {
      return false;
    }

    this.keys.set(key, Date.now() + ttlSeconds * 1000);
    return true;
  }

  async remove(key: string): Promise<void> {
    this.keys.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.keys.entries()) {
      if (expiresAt <= now) {
        this.keys.delete(key);
      }
    }
  }
}

interface BucketState {
  tokens: number;
  updatedAtMs: number;
}

export class InMemoryTokenBucketRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, BucketState>();

  constructor(
    private readonly capacity: number,
    private readonly refillRatePerSecond: number,
  ) {}

  async consume(tenantId: string): Promise<boolean> {
    const now = Date.now();
    const current = this.buckets.get(tenantId) ?? {
      tokens: this.capacity,
      updatedAtMs: now,
    };

    const elapsedMs = Math.max(0, now - current.updatedAtMs);
    const refill = elapsedMs * (this.refillRatePerSecond / 1000);
    const tokens = Math.min(this.capacity, current.tokens + refill);

    if (tokens < 1) {
      this.buckets.set(tenantId, { tokens, updatedAtMs: now });
      return false;
    }

    this.buckets.set(tenantId, {
      tokens: tokens - 1,
      updatedAtMs: now,
    });

    return true;
  }
}

export class InMemoryQueueClient implements QueueClient {
  readonly queue: QueueEventEnvelope[] = [];
  readonly dlq: Record<string, unknown>[] = [];

  async push(envelope: QueueEventEnvelope): Promise<void> {
    this.queue.push(envelope);
  }

  async pop(_blockMs: number): Promise<QueueEventEnvelope | null> {
    const item = this.queue.shift();
    return item ?? null;
  }

  async pushDlq(payload: Record<string, unknown>): Promise<void> {
    this.dlq.push(payload);
  }
}

export class InMemoryConversationEventRepository implements ConversationEventRepository {
  readonly events: QueueEventEnvelope['event'][] = [];

  async insert(event: QueueEventEnvelope['event']): Promise<void> {
    this.events.push(event);
  }
}
