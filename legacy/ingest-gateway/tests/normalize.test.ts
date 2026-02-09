import { describe, expect, it } from 'vitest';
import { normalizeChat, normalizeSms, normalizeVoice } from '../src/core/normalize';
import { ChannelType } from '../src/core/types';

describe('normalization', () => {
  it('normalizes SMS payload into ConversationEvent', () => {
    const event = normalizeSms({
      tenant_id: 'tenant-a',
      From: '+14155550100',
      To: '+14155550101',
      Body: 'hello',
      MessageSid: 'SM123',
      Timestamp: '2026-02-09T12:00:00.000Z',
    });

    expect(event.channel_type).toBe(ChannelType.SMS);
    expect(event.provider_message_id).toBe('SM123');
    expect(event.content).toBe('hello');
    expect(event.metadata).toMatchObject({
      from: '+14155550100',
      to: '+14155550101',
    });
    expect(event.raw_metadata).toMatchObject({
      MessageSid: 'SM123',
      From: '+14155550100',
      To: '+14155550101',
      Body: 'hello',
    });
  });

  it('normalizes chat payload and derives provider_message_id when absent', () => {
    const event = normalizeChat({
      tenant_id: 'tenant-b',
      userId: 'user-1',
      message: 'chat message',
      chatId: 'chat-77',
      timestamp: '2026-02-09T12:01:00.000Z',
    });

    expect(event.channel_type).toBe(ChannelType.CHAT);
    expect(event.provider_message_id).toBe('chat-77:2026-02-09T12:01:00.000Z:user-1');
    expect(event.content).toBe('chat message');
    expect(event.raw_metadata).toMatchObject({
      chatId: 'chat-77',
      userId: 'user-1',
    });
  });

  it('normalizes voice payload and uses segment-aware provider_message_id', () => {
    const event = normalizeVoice({
      tenant_id: 'tenant-c',
      callId: 'call-9',
      segmentId: 'seg-1',
      transcript_text: 'voice transcript',
      confidence: 0.93,
      duration: 12,
      timestamp: '2026-02-09T12:02:00.000Z',
    });

    expect(event.channel_type).toBe(ChannelType.VOICE);
    expect(event.provider_message_id).toBe('call-9:seg-1');
    expect(event.metadata).toMatchObject({ callId: 'call-9', confidence: 0.93, duration: 12 });
    expect(event.raw_metadata).toMatchObject({ callId: 'call-9', segmentId: 'seg-1' });
  });
});
