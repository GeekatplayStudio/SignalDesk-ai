import { Router } from 'express';
import crypto from 'crypto';
import { AgentService } from '../core/agentService';

interface Incident {
  id: string;
  type: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

const incidents: Incident[] = [];

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export function createOpsRouter(agentService: AgentService): Router {
  const router = Router();

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

  router.post('/v1/incidents/simulate', (req, res) => {
    const type = typeof req.body?.type === 'string' ? req.body.type : 'custom';
    const incident: Incident = {
      id: crypto.randomUUID(),
      type,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    incidents.push(incident);
    return res.json({ incident });
  });

  router.get('/v1/incidents', (_req, res) => {
    return res.json({ incidents: incidents.slice().reverse() });
  });

  return router;
}
