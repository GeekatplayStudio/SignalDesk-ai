import { describe, expect, it, vi } from 'vitest';
import { IngestionService } from './ingestionService';
import { ChannelType, ConversationEvent } from './types';
import {
  InMemoryIdempotencyStore,
  InMemoryQueueClient,
  InMemoryTokenBucketRateLimiter,
} from '../testing/inMemoryAdapters';
import { RateLimiter } from './ports';

function buildEvent(providerMessageId: string): ConversationEvent {
  return {
    event_id: `evt-${providerMessageId}`,
    provider_message_id: providerMessageId,
    tenant_id: 'tenant-a',
    channel_type: ChannelType.CHAT,
    timestamp: new Date().toISOString(),
    content: 'hello',
    metadata: {},
    raw_metadata: {},
  };
}

describe('ingestion service', () => {
  it('accepts first event and marks duplicate retries', async () => {
    const idempotency = new InMemoryIdempotencyStore();
    const queue = new InMemoryQueueClient();
    const limiter = new InMemoryTokenBucketRateLimiter(10, 10);
    const service = new IngestionService(idempotency, limiter, queue, { idempotencyTtlSeconds: 60 });
    const event = buildEvent('msg-1');

    const first = await service.ingest(event);
    const second = await service.ingest(event);

    expect(first.status).toBe('accepted');
    expect(second.status).toBe('duplicate');
    expect(queue.queue).toHaveLength(1);
  });

  it('removes idempotency claim if request is rate limited', async () => {
    const idempotency = new InMemoryIdempotencyStore();
    const queue = new InMemoryQueueClient();
    const consume = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const limiter: RateLimiter = {
      consume,
    };
    const service = new IngestionService(idempotency, limiter, queue, { idempotencyTtlSeconds: 60 });
    const event = buildEvent('msg-2');

    const first = await service.ingest(event);
    const keyStillExists = await idempotency.exists('idempotency:msg-2');
    const second = await service.ingest(event);

    expect(first.status).toBe('rate_limited');
    expect(keyStillExists).toBe(false);
    expect(second.status).toBe('accepted');
    expect(queue.queue).toHaveLength(1);
  });
});
