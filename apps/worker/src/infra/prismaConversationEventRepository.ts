import { prisma } from '../../../../packages/db/src/index';
import { ConversationEvent } from '../core/types';

export class PrismaConversationEventRepository {
  async insert(event: ConversationEvent): Promise<void> {
    await prisma.ingestEvent.upsert({
      where: { providerMessageId: event.provider_message_id },
      update: {},
      create: {
        id: event.event_id,
        providerMessageId: event.provider_message_id,
        channel: event.channel_type.toLowerCase(),
        payload: toJsonPayload(event.raw_metadata),
        conversationId: null,
      },
    });
  }
}

function toJsonPayload(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value));
}
