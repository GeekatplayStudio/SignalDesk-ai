import { Pool } from 'pg';
import { ConversationEventRepository } from '../core/ports';
import { ConversationEvent } from '../core/types';

export class PostgresConversationEventRepository implements ConversationEventRepository {
  constructor(private readonly pool: Pool) {}

  async insert(event: ConversationEvent): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO conversation_events (
        id,
        provider_message_id,
        tenant_id,
        channel,
        content,
        raw_metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (provider_message_id) DO NOTHING
      `,
      [
        event.event_id,
        event.provider_message_id,
        event.tenant_id,
        event.channel_type.toLowerCase(),
        event.content,
        JSON.stringify(event.raw_metadata),
      ],
    );
  }

  async countByProviderMessageId(providerMessageId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM conversation_events
      WHERE provider_message_id = $1
      `,
      [providerMessageId],
    );

    return Number(result.rows[0]?.count ?? 0);
  }
}
