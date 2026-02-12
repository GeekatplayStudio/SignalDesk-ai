import { Router } from 'express';
import crypto from 'crypto';
import { AgentService } from '../core/agentService';
import { SimulationRun, SimulationService } from '../core/simulationService';

interface Incident {
  id: string;
  type: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  severity: 'info' | 'critical';
  summary?: string;
  source: 'manual' | 'simulation';
  createdAt: string;
}

const incidents: Incident[] = [];

interface OpsRouterOptions {
  simulationEnabled?: boolean;
  requireModelPlannerForSimulation?: boolean;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export function createOpsRouter(agentService: AgentService, options: OpsRouterOptions = {}): Router {
  const router = Router();
  const simulationService = new SimulationService(agentService, {
    enabled: options.simulationEnabled ?? false,
    requireModelPlanner: options.requireModelPlannerForSimulation ?? false,
    onRunFinished: (run) => {
      if (run.status === 'completed_with_critical_issues' || run.status === 'failed') {
        createIncident({
          type: `simulation.${run.scenarioId}`,
          status: 'failed',
          severity: 'critical',
          summary: summarizeSimulationIncident(run),
          source: 'simulation',
        });
      }
    },
  });

  router.get('/v1/metrics/overview', async (_req, res) => {
    const runs = await agentService.getAgentRuns();
    type Run = (typeof runs)[number];
    const latencies = runs.map((r: Run) => r.latencyMs ?? 0).filter((n: number) => n > 0);
    const toolFailures = runs.filter((r: Run) => r.toolCalls.some((t: Run['toolCalls'][number]) => t.status === 'failed')).length;
    const handoffs = runs.filter((r: Run) => r.toolCalls.some((t: Run['toolCalls'][number]) => t.tool === 'handoff_to_human')).length;

    return res.json({
      p50_latency_ms: percentile(latencies, 50),
      p95_latency_ms: percentile(latencies, 95),
      tool_failure_rate: runs.length ? toolFailures / runs.length : 0,
      handoff_rate: runs.length ? handoffs / runs.length : 0,
      total_runs: runs.length,
    });
  });

  router.get('/v1/simulations/config', (_req, res) => {
    return res.json(simulationService.getConfig());
  });

  router.patch('/v1/simulations/config', (req, res) => {
    if (typeof req.body?.enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled boolean is required' });
    }

    const config = simulationService.setEnabled(req.body.enabled);
    return res.json(config);
  });

  router.get('/v1/simulations/scenarios', (_req, res) => {
    return res.json({
      enabled: simulationService.getConfig().enabled,
      scenarios: simulationService.listScenarios(),
    });
  });

  router.post('/v1/simulations/run', (req, res) => {
    const scenarioId = typeof req.body?.scenario_id === 'string' ? req.body.scenario_id.trim() : '';
    if (!scenarioId) {
      return res.status(400).json({ error: 'scenario_id is required' });
    }

    try {
      const run = simulationService.startRun(scenarioId);
      return res.status(202).json({ run });
    } catch (error) {
      const code = (error as Error).message;
      if (code === 'simulation_mode_disabled') {
        return res.status(403).json({
          error: 'simulation_mode_disabled',
          message: 'Set ENABLE_SIMULATION_MODE=true to execute simulation scenarios.',
        });
      }

      if (code === 'simulation_already_running') {
        return res.status(409).json({
          error: 'simulation_already_running',
          active_run_id: simulationService.getConfig().activeRunId,
          active_scenario_id: simulationService.getConfig().activeScenarioId,
        });
      }

      if (code === 'unknown_scenario') {
        return res.status(404).json({ error: 'unknown_scenario' });
      }

      return res.status(500).json({ error: 'simulation_start_failed' });
    }
  });

  router.get('/v1/simulations/runs', (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 20;
    return res.json({
      runs: simulationService.listRuns(safeLimit),
      ...simulationService.getConfig(),
    });
  });

  router.get('/v1/simulations/runs/:id', (req, res) => {
    const run = simulationService.getRunById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'not_found' });
    }
    return res.json({ run });
  });

  router.post('/v1/incidents/simulate', (req, res) => {
    const type = typeof req.body?.type === 'string' ? req.body.type : 'custom';
    const incident = createIncident({
      type,
      status: 'completed',
      severity: 'info',
      source: 'manual',
    });
    return res.json({ incident });
  });

  router.get('/v1/incidents', (_req, res) => {
    return res.json({ incidents: incidents.slice().reverse() });
  });

  return router;
}

function createIncident(input: {
  type: string;
  status: Incident['status'];
  severity: Incident['severity'];
  source: Incident['source'];
  summary?: string;
}): Incident {
  const incident: Incident = {
    id: crypto.randomUUID(),
    type: input.type,
    status: input.status,
    severity: input.severity,
    source: input.source,
    summary: input.summary,
    createdAt: new Date().toISOString(),
  };

  incidents.push(incident);
  return incident;
}

function summarizeSimulationIncident(run: SimulationRun): string {
  if (run.criticalIssues.length === 0) {
    return `Simulation run ${run.id} failed without explicit critical issue details.`;
  }

  const topIssues = run.criticalIssues.slice(0, 3).join('; ');
  return `${run.scenarioName}: ${topIssues}`;
}
