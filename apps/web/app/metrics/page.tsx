'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Metrics = {
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  tool_failure_rate: number;
  handoff_rate: number;
  total_runs: number;
};

export default function MetricsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metrics-overview'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/metrics/overview`);
      if (!res.ok) throw new Error(`Failed to fetch metrics (${res.status})`);
      return (await res.json()) as Metrics;
    },
  });

  const cards: Array<{ label: string; value: string }> = [
    { label: 'p50 latency', value: formatMs(data?.p50_latency_ms) },
    { label: 'p95 latency', value: formatMs(data?.p95_latency_ms) },
    { label: 'tool failure rate', value: formatPct(data?.tool_failure_rate) },
    { label: 'handoff rate', value: formatPct(data?.handoff_rate) },
    { label: 'total runs', value: data?.total_runs?.toString() ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Metrics</p>
        <h1 className="text-2xl font-semibold">Overview</h1>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-rose-400">Error: {(error as Error).message}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="text-2xl font-semibold mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMs(value?: number | null) {
  if (value == null) return '—';
  return `${value} ms`;
}

function formatPct(value?: number) {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}
