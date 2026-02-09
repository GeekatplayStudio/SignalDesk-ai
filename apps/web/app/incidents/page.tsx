'use client';

import { useQuery } from '@tanstack/react-query';

type Incident = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function IncidentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/incidents`);
      if (!res.ok) throw new Error(`Failed to fetch incidents (${res.status})`);
      return (await res.json()) as { incidents: Incident[] };
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Incidents</p>
        <h1 className="text-2xl font-semibold">Simulation history</h1>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-rose-400">Error: {(error as Error).message}</p>}

      <div className="space-y-2">
        {data?.incidents?.map((incident) => (
          <div
            key={incident.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{incident.type}</p>
              <p className="text-xs text-slate-400">{new Date(incident.createdAt).toLocaleString()}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200">
              {incident.status}
            </span>
          </div>
        ))}
        {!isLoading && (data?.incidents?.length ?? 0) === 0 && (
          <p className="text-sm text-slate-500">No incidents yet. Trigger POST /v1/incidents/simulate.</p>
        )}
      </div>
    </div>
  );
}
