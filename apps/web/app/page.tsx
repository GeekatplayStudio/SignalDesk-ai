'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export default function HomePage() {
  const metrics = useQuery({
    queryKey: ['metrics'],
    queryFn: () => fetchJson<{ p50_latency_ms: number | null; p95_latency_ms: number | null; tool_failure_rate: number; handoff_rate: number; total_runs: number }>('/v1/metrics/overview'),
  });

  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetchJson<{ conversations: Array<{ id: string; title?: string; createdAt: string }> }>('/v1/conversations'),
  });

  const evals = useQuery({
    queryKey: ['evals'],
    queryFn: () => fetchJson<{ runs: Array<{ id: string; status: string; passRate: number; createdAt: string }> }>('/v1/evals/runs'),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Geekatplay Studio</p>
          <h1 className="text-3xl font-semibold">Unified Ops Dashboard</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="p50 latency" value={metrics.data?.p50_latency_ms ? `${metrics.data.p50_latency_ms} ms` : '—'} loading={metrics.isLoading} />
        <StatCard label="tool failure rate" value={metrics.data ? `${Math.round(metrics.data.tool_failure_rate * 100)}%` : '—'} loading={metrics.isLoading} />
        <StatCard label="handoff rate" value={metrics.data ? `${Math.round(metrics.data.handoff_rate * 100)}%` : '—'} loading={metrics.isLoading} />
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Conversations</h2>
          <span className="text-sm text-slate-400">{conversations.data?.conversations.length ?? 0} total</span>
        </div>
        <div className="space-y-2">
          {conversations.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
          {conversations.data?.conversations.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Conversation {c.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-400">Created {new Date(c.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {conversations.data && conversations.data.conversations.length === 0 && (
            <p className="text-sm text-slate-500">No conversations yet. Send a message via /v1/agent/respond.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Eval Runs</h2>
          <span className="text-sm text-slate-400">{evals.data?.runs.length ?? 0} total</span>
        </div>
        <div className="space-y-2">
          {evals.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
          {evals.data?.runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Run {run.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-400">{new Date(run.createdAt).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${run.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'}`}>
                {run.status} ({Math.round(run.passRate * 100)}%)
              </span>
            </div>
          ))}
          {evals.data && evals.data.runs.length === 0 && (
            <p className="text-sm text-slate-500">No evals yet. Trigger via POST /v1/evals/run.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{loading ? '…' : value}</p>
      </CardContent>
    </Card>
  );
}
