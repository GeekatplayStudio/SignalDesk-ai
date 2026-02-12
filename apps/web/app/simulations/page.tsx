'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type SimulationScenario = {
  id: string;
  name: string;
  description: string;
  lifeExample: string;
  criticalChecks: string[];
  turns: Array<{
    id: string;
    userMessage: string;
    expectedTool: string;
  }>;
};

type SimulationStep = {
  turnId: string;
  expectedTool: string;
  selectedTool: string | null;
  plannerSource: string;
  status: 'completed' | 'critical' | 'failed';
  latencyMs: number | null;
  criticalIssues: string[];
};

type SimulationRun = {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: 'running' | 'completed' | 'completed_with_critical_issues' | 'failed';
  startedAt: string;
  endedAt: string | null;
  summary: {
    totalTurns: number;
    completedTurns: number;
    criticalIssueCount: number;
    failedToolCalls: number;
    handoffCount: number;
    plannerMix: {
      python: number;
      openai: number;
      rules: number;
      unknown: number;
    };
  };
  criticalIssues: string[];
  steps: SimulationStep[];
};

type SimulationConfig = {
  enabled: boolean;
  activeRunId: string | null;
  activeScenarioId: string | null;
  activeScenarioName: string | null;
};

export default function SimulationsPage() {
  const queryClient = useQueryClient();

  const config = useQuery({
    queryKey: ['simulations-config'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/simulations/config`);
      if (!res.ok) throw new Error(`Failed to fetch simulation config (${res.status})`);
      return (await res.json()) as SimulationConfig;
    },
    refetchInterval: 2000,
  });

  const scenarios = useQuery({
    queryKey: ['simulation-scenarios'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/simulations/scenarios`);
      if (!res.ok) throw new Error(`Failed to fetch scenarios (${res.status})`);
      return (await res.json()) as { enabled: boolean; scenarios: SimulationScenario[] };
    },
  });

  const runs = useQuery({
    queryKey: ['simulation-runs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/simulations/runs?limit=20`);
      if (!res.ok) throw new Error(`Failed to fetch simulation runs (${res.status})`);
      return (await res.json()) as { runs: SimulationRun[] };
    },
    refetchInterval: 2000,
  });

  const startRun = useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await fetch(`${API_BASE}/v1/simulations/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(typeof body.message === 'string' ? body.message : `Failed to start simulation (${res.status})`);
      }

      return body;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['simulations-config'] }),
        queryClient.invalidateQueries({ queryKey: ['simulation-runs'] }),
      ]);
    },
  });

  const modeEnabled = config.data?.enabled ?? scenarios.data?.enabled ?? false;
  const activeRunId = config.data?.activeRunId;
  const activeScenarioName = config.data?.activeScenarioName;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Simulation Server</p>
          <h1 className="text-2xl font-semibold">Live Scenario Runner</h1>
          <p className="text-sm text-slate-400 mt-1">
            Run realistic chat scenarios and surface critical handling issues in one view.
          </p>
        </div>
        <span className={`rounded px-2.5 py-1 text-xs ${modeEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
          {modeEnabled ? 'simulation enabled' : 'simulation disabled'}
        </span>
      </div>

      {!modeEnabled && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ENABLE_SIMULATION_MODE is off. Set `ENABLE_SIMULATION_MODE=true` and restart API/worker to run scenarios.
        </div>
      )}

      {activeRunId && (
        <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4 text-sm text-cyan-200">
          Active scenario: <span className="font-medium">{activeScenarioName ?? 'unknown'}</span> (run {activeRunId.slice(0, 8)})
        </div>
      )}

      {startRun.error && (
        <p className="text-sm text-rose-400">
          Start failed: {(startRun.error as Error).message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Scenario Catalog</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {scenarios.data?.scenarios.map((scenario) => (
            <div key={scenario.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{scenario.name}</h3>
                  <p className="text-sm text-slate-300">{scenario.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startRun.mutate(scenario.id)}
                  disabled={!modeEnabled || Boolean(activeRunId) || startRun.isPending}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  Run Scenario
                </button>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/70 p-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Live Example</p>
                <p className="text-sm text-slate-200">{scenario.lifeExample}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Critical Checks</p>
                <ul className="space-y-1">
                  {scenario.criticalChecks.map((check) => (
                    <li key={check} className="text-sm text-slate-300">
                      - {check}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-400">{scenario.turns.length} turns in this scenario</p>
            </div>
          ))}
        </div>
        {scenarios.isLoading && <p className="text-sm text-slate-400">Loading scenarios…</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent Runs</h2>
        {runs.isLoading && <p className="text-sm text-slate-400">Loading runs…</p>}
        {runs.error && <p className="text-sm text-rose-400">Error: {(runs.error as Error).message}</p>}

        <div className="space-y-3">
          {runs.data?.runs.map((run) => (
            <div key={run.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{run.scenarioName}</p>
                  <p className="text-xs text-slate-400">
                    Started {new Date(run.startedAt).toLocaleString()}
                    {run.endedAt ? ` · Ended ${new Date(run.endedAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <span className={`rounded px-2 py-1 text-xs ${statusClass(run.status)}`}>
                  {run.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Metric label="Turns" value={`${run.summary.completedTurns}/${run.summary.totalTurns}`} />
                <Metric label="Critical Issues" value={String(run.summary.criticalIssueCount)} />
                <Metric label="Failed Tools" value={String(run.summary.failedToolCalls)} />
                <Metric label="Handoffs" value={String(run.summary.handoffCount)} />
                <Metric label="Planner Mix" value={`P:${run.summary.plannerMix.python} O:${run.summary.plannerMix.openai} R:${run.summary.plannerMix.rules}`} />
              </div>

              {run.criticalIssues.length > 0 && (
                <div className="rounded border border-rose-900/60 bg-rose-950/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-rose-300 mb-1">Critical Issues</p>
                  <ul className="space-y-1">
                    {run.criticalIssues.slice(0, 6).map((issue) => (
                      <li key={issue} className="text-sm text-rose-200">
                        - {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                {run.steps.map((step) => (
                  <div key={step.turnId} className="rounded border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{step.turnId}</p>
                      <span className={`rounded px-2 py-0.5 text-xs ${stepStatusClass(step.status)}`}>{step.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      expected `{step.expectedTool}` · selected `{step.selectedTool ?? 'none'}` · planner `{step.plannerSource}` · latency{' '}
                      {step.latencyMs == null ? 'n/a' : `${step.latencyMs}ms`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!runs.isLoading && (runs.data?.runs.length ?? 0) === 0 && (
            <p className="text-sm text-slate-500">No simulation runs yet. Run a scenario from the catalog above.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/70 p-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function statusClass(status: SimulationRun['status']): string {
  if (status === 'completed') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'completed_with_critical_issues') return 'bg-amber-500/20 text-amber-200';
  if (status === 'failed') return 'bg-rose-500/20 text-rose-200';
  return 'bg-cyan-500/20 text-cyan-200';
}

function stepStatusClass(status: SimulationStep['status']): string {
  if (status === 'completed') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'critical') return 'bg-amber-500/20 text-amber-200';
  return 'bg-rose-500/20 text-rose-200';
}
