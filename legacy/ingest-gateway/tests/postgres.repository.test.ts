import { describe, expect, it } from 'vitest';
import { ChannelType, ConversationEvent } from '../src/core/types';
import { PostgresConversationEventRepository } from '../src/infra/postgresConversationEventRepository';

class FakePool {
  lastQueryText = '';
  lastQueryValues: unknown[] = [];

  async query(text: string, values: unknown[] = []): Promise<{ rows: Array<{ count: string }> }> {
    this.lastQueryText = text;
    this.lastQueryValues = values;
    return { rows: [{ count: '1' }] };
  }
}

function sampleEvent(): ConversationEvent {
  return {
    event_id: '11111111-1111-1111-1111-111111111111',
    provider_message_id: 'provider-1',
    tenant_id: 'tenant-1',
    channel_type: ChannelType.SMS,
    timestamp: '2026-02-09T00:00:00.000Z',
    content: 'hello',
    metadata: { from: '+1', to: '+2' },
    raw_metadata: { tenant_id: 'tenant-1', From: '+1', To: '+2', Body: 'hello', MessageSid: 'provider-1' },
  };
}

describe('PostgresConversationEventRepository', () => {
  it('inserts into strict schema columns and conflict guard', async () => {
    const pool = new FakePool();
    const repository = new PostgresConversationEventRepository(pool as never);

    await repository.insert(sampleEvent());

    expect(pool.lastQueryText).toContain('INSERT INTO conversation_events');
    expect(pool.lastQueryText).toContain('id');
    expect(pool.lastQueryText).toContain('channel');
    expect(pool.lastQueryText).toContain('raw_metadata');
    expect(pool.lastQueryText).toContain('ON CONFLICT (provider_message_id) DO NOTHING');
    expect(pool.lastQueryValues).toEqual([
      '11111111-1111-1111-1111-111111111111',
      'provider-1',
      'tenant-1',
      'sms',
      'hello',
      JSON.stringify(sampleEvent().raw_metadata),
    ]);
  });

  it('counts rows by provider_message_id', async () => {
    const pool = new FakePool();
    const repository = new PostgresConversationEventRepository(pool as never);

    const count = await repository.countByProviderMessageId('provider-1');

    expect(count).toBe(1);
    expect(pool.lastQueryText).toContain('SELECT COUNT(*)::text AS count');
    expect(pool.lastQueryValues).toEqual(['provider-1']);
  });
});
