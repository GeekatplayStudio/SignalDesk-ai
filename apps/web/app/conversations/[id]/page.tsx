'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

type Run = {
  id: string;
  status: string;
  latencyMs?: number | null;
  createdAt: string;
  toolCalls: { tool: string; status: string }[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/conversations/${conversationId}`);
      if (!res.ok) throw new Error(`Failed to fetch conversation (${res.status})`);
      return (await res.json()) as {
        conversation: { id: string; title?: string | null; createdAt: string };
        messages: Message[];
        runs: Run[];
      };
    },
    enabled: !!conversationId,
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Conversation</p>
        <h1 className="text-2xl font-semibold">
          {data?.conversation?.title || `Conversation ${conversationId?.slice(0, 8)}`}
        </h1>
        <p className="text-xs text-slate-500">
          Created {data?.conversation?.createdAt && new Date(data.conversation.createdAt).toLocaleString()}
        </p>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-rose-400">Error: {(error as Error).message}</p>}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h2 className="text-lg font-medium">Messages</h2>
        <div className="space-y-2">
          {data?.messages?.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-800 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">{m.role}</p>
              <p className="text-sm text-slate-100">{m.content}</p>
              <p className="text-[11px] text-slate-500">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {data && data.messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h2 className="text-lg font-medium">Agent Runs</h2>
        <div className="space-y-2">
          {data?.runs?.map((run) => (
            <div key={run.id} className="rounded-lg border border-slate-800 px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Run {run.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200">
                  {run.status} {run.latencyMs ? `(${run.latencyMs} ms)` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tools: {run.toolCalls.map((t) => `${t.tool}${t.status === 'failed' ? ' (fail)' : ''}`).join(', ')}
              </p>
            </div>
          ))}
          {data && data.runs.length === 0 && (
            <p className="text-sm text-slate-500">No runs yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
