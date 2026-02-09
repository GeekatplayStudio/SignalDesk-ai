'use client';

import { useQuery } from '@tanstack/react-query';
import { useRunEvals } from './actions';

type EvalRun = {
  id: string;
  status: string;
  passRate: number;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function EvalsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['eval-runs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/evals/runs`);
      if (!res.ok) throw new Error(`Failed to fetch eval runs (${res.status})`);
      return (await res.json()) as { runs: EvalRun[] };
    },
  });

  const runEvals = useRunEvals();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Evals</p>
          <h1 className="text-2xl font-semibold">Evaluation runs</h1>
        </div>
        <button
          onClick={() => runEvals.mutate()}
          disabled={runEvals.isPending}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {runEvals.isPending ? 'Running…' : 'Run evals'}
        </button>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-rose-400">Error: {(error as Error).message}</p>}
      {runEvals.error && (
        <p className="text-sm text-rose-400">Error: {(runEvals.error as Error).message}</p>
      )}

      <div className="space-y-2">
        {data?.runs?.map((run) => (
          <div
            key={run.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">Run {run.id.slice(0, 8)}</p>
              <p className="text-xs text-slate-400">{new Date(run.createdAt).toLocaleString()}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                run.status === 'passed'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-200'
              }`}
            >
              {run.status} ({Math.round(run.passRate * 100)}%)
            </span>
          </div>
        ))}
        {!isLoading && (data?.runs?.length ?? 0) === 0 && (
          <p className="text-sm text-slate-500">No evals yet. Trigger POST /v1/evals/run.</p>
        )}
      </div>
    </div>
  );
}
