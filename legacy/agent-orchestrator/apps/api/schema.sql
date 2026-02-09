CREATE TABLE conversations (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NULL,
    status VARCHAR DEFAULT 'active', -- active, handoff, closed
    slots JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR NOT NULL REFERENCES conversations(id),
    role VARCHAR NOT NULL, -- user, assistant, tool
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tool_logs (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR NOT NULL REFERENCES conversations(id),
    message_id INTEGER NULL REFERENCES messages(id),
    tool_name VARCHAR NOT NULL,
    input_params JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    execution_time_ms INTEGER NOT NULL,
    status VARCHAR NOT NULL, -- success, timeout, error, circuit_open
    error_msg TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_order ON messages (conversation_id, order_index);
CREATE INDEX idx_tool_logs_conversation_created_at ON tool_logs (conversation_id, created_at);
