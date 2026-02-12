import { describe, expect, it, vi } from 'vitest';
import { ConversationWorker } from './worker';
import { ChannelType, QueueEventEnvelope } from './core/types';
import { ConversationEventRepository, QueueClient } from './core/ports';

function buildEnvelope(id: string): QueueEventEnvelope {
  return {
    event: {
      event_id: id,
      provider_message_id: `provider-${id}`,
      tenant_id: 'tenant-a',
      channel_type: ChannelType.CHAT,
      timestamp: '2026-02-10T12:00:00.000Z',
      content: 'hello',
      metadata: {},
      raw_metadata: {},
    },
  };
}

describe('conversation worker', () => {
  it('persists queue event on successful processing', async () => {
    const envelope = buildEnvelope('evt-1');
    const queue: QueueClient = {
      push: vi.fn().mockResolvedValue(undefined),
      pop: vi.fn().mockResolvedValueOnce(envelope).mockResolvedValueOnce(null),
      pushDlq: vi.fn().mockResolvedValue(undefined),
    };
    const repository: ConversationEventRepository = {
      insert: vi.fn().mockResolvedValue(undefined),
    };

    const worker = new ConversationWorker(queue, repository, {
      maxRetries: 2,
      baseBackoffMs: 0,
      queuePollBlockMs: 0,
    });

    await worker.runOnce();

    expect(repository.insert).toHaveBeenCalledTimes(1);
    expect(repository.insert).toHaveBeenCalledWith(envelope.event);
    expect(queue.pushDlq).not.toHaveBeenCalled();
  });

  it('sends event to DLQ after retry exhaustion', async () => {
    const envelope = buildEnvelope('evt-2');
    const pushDlq = vi.fn().mockResolvedValue(undefined);
    const queue: QueueClient = {
      push: vi.fn().mockResolvedValue(undefined),
      pop: vi.fn().mockResolvedValueOnce(envelope).mockResolvedValueOnce(null),
      pushDlq,
    };
    const repository: ConversationEventRepository = {
      insert: vi.fn().mockRejectedValue(new Error('db_down')),
    };

    const worker = new ConversationWorker(queue, repository, {
      maxRetries: 2,
      baseBackoffMs: 0,
      queuePollBlockMs: 0,
    });

    await worker.runOnce();

    expect(repository.insert).toHaveBeenCalledTimes(2);
    expect(pushDlq).toHaveBeenCalledTimes(1);
    const dlqPayload = pushDlq.mock.calls[0][0] as Record<string, unknown>;
    expect(dlqPayload.error).toBe('db_down');
    expect(dlqPayload.retries).toBe(2);
  });
});
