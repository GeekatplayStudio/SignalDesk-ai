import { v4 as uuidv4 } from 'uuid';
import { ChannelType, ConversationEvent } from './types';
import { ChatIngestInput, SmsIngestInput, VoiceIngestInput } from './schemas';

const defaultTimestamp = () => new Date().toISOString();

export function normalizeSms(input: SmsIngestInput): ConversationEvent {
  return {
    event_id: uuidv4(),
    provider_message_id: input.MessageSid,
    tenant_id: input.tenant_id,
    channel_type: ChannelType.SMS,
    timestamp: input.Timestamp ?? defaultTimestamp(),
    content: input.Body,
    metadata: {
      from: input.From,
      to: input.To,
    },
    raw_metadata: { ...input },
  };
}

export function normalizeChat(input: ChatIngestInput): ConversationEvent {
  const normalizedTimestamp = input.timestamp ?? defaultTimestamp();
  const providerMessageId = input.messageId ?? `${input.chatId}:${normalizedTimestamp}:${input.userId}`;

  return {
    event_id: uuidv4(),
    provider_message_id: providerMessageId,
    tenant_id: input.tenant_id,
    channel_type: ChannelType.CHAT,
    timestamp: normalizedTimestamp,
    content: input.message,
    metadata: {
      userId: input.userId,
      chatId: input.chatId,
      ...(input.metadata ?? {}),
    },
    raw_metadata: { ...input },
  };
}

export function normalizeVoice(input: VoiceIngestInput): ConversationEvent {
  const providerMessageId = input.segmentId ? `${input.callId}:${input.segmentId}` : input.callId;

  return {
    event_id: uuidv4(),
    provider_message_id: providerMessageId,
    tenant_id: input.tenant_id,
    channel_type: ChannelType.VOICE,
    timestamp: input.timestamp ?? defaultTimestamp(),
    content: input.transcript_text,
    metadata: {
      callId: input.callId,
      confidence: input.confidence,
      duration: input.duration ?? 0,
      ...(input.metadata ?? {}),
    },
    raw_metadata: { ...input },
  };
}
