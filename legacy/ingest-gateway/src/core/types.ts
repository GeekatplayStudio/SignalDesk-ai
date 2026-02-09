export enum ChannelType {
  SMS = 'SMS',
  CHAT = 'CHAT',
  VOICE = 'VOICE',
}

export interface ConversationEvent {
  event_id: string;
  provider_message_id: string;
  tenant_id: string;
  channel_type: ChannelType;
  timestamp: string;
  content: string;
  metadata: Record<string, unknown>;
  raw_metadata: Record<string, unknown>;
}

export interface QueueEventEnvelope {
  event: ConversationEvent;
}

export type IngestResult =
  | { status: 'accepted'; eventId: string }
  | { status: 'duplicate' }
  | { status: 'rate_limited' };
