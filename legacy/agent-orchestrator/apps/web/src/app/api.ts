export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export type Conversation = {
  id: string;
  user_id: string | null;
  status: 'active' | 'handoff' | 'closed';
  slots: Record<string, unknown>;
  created_at: string;
};

export type ChatMessage = {
  id: number;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  order_index: number;
  created_at: string;
};

export type ToolLog = {
  id: number;
  message_id: number | null;
  tool_name: string;
  input_params: Record<string, unknown>;
  output: Record<string, unknown>;
  execution_time_ms: number;
  status: 'success' | 'timeout' | 'error' | 'circuit_open';
  error_msg: string | null;
  created_at: string;
};

export type AgentTurnResponse = {
  response: string;
  tool_calls: Array<{
    id: number;
    tool_name: string;
    input_json: Record<string, unknown>;
    output_json: Record<string, unknown>;
    duration_ms: number;
    status: 'success' | 'timeout' | 'error' | 'circuit_open';
    error_msg: string | null;
    created_at: string | null;
  }>;
  conversation_status: 'active' | 'handoff' | 'closed';
  latency_ms: number;
  confidence: number | null;
  slots: Record<string, unknown>;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export async function createConversation(userId?: string) {
  return apiFetch<Conversation>(`${API_BASE}/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId || null }),
  });
}

export async function getConversation(conversationId: string) {
  return apiFetch<Conversation>(`${API_BASE}/conversation/${conversationId}`);
}

export async function sendMessage(conversationId: string, content: string) {
  return apiFetch<AgentTurnResponse>(`${API_BASE}/conversation/${conversationId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, role: 'user' }),
  });
}

export async function emergencyHandoff(conversationId: string, reason?: string) {
  return apiFetch<{ conversation_id: string; status: string; reason: string }>(
    `${API_BASE}/conversation/${conversationId}/handoff`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Manual emergency takeover from console' }),
    },
  );
}

export async function getHistory(conversationId: string) {
  return apiFetch<ChatMessage[]>(`${API_BASE}/conversation/${conversationId}/history`);
}

export async function getLogs(conversationId: string) {
  return apiFetch<ToolLog[]>(`${API_BASE}/conversation/${conversationId}/logs`);
}
