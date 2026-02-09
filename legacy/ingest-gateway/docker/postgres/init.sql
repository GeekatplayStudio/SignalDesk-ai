CREATE TABLE IF NOT EXISTS conversation_events (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_message_id TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'chat', 'voice')),
  content TEXT NOT NULL,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_events_tenant_created_at
ON conversation_events (tenant_id, created_at);
