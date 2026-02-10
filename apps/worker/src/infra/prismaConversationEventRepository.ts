import { Prisma, prisma } from '@agentops/db';
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
        payload: event.raw_metadata as any,
        conversationId: null,
      },
    });
  }
}
