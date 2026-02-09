import express from 'express';
import { IngestionService } from '../core/ingestionService';
import { AgentService } from '../core/agentService';
import { createAgentRouter } from './agentRoutes';
import { createEvalRouter } from './evalRoutes';
import { createOpsRouter } from './opsRoutes';
import { createIngestRouter } from './routes';

export interface AppDiagnostics {
  getProviderEventCount?: (providerMessageId: string) => Promise<number>;
  getDlqEntries?: (limit: number) => Promise<Record<string, unknown>[]>;
}

export interface AppOptions {
  enableCors?: boolean;
  corsOrigin?: string;
}

export function createApp(
  ingestionService: IngestionService,
  diagnostics: AppDiagnostics = {},
  options: AppOptions = {},
  agentService?: AgentService,
) {
  const app = express();

  if (options.enableCors) {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', options.corsOrigin ?? '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      next();
    });
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/v1/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/v1/readyz', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.get('/v1/internal/events/count', async (req, res) => {
    if (!diagnostics.getProviderEventCount) {
      return res.status(501).json({ error: 'not_configured' });
    }

    const providerMessageId = req.query.provider_message_id;
    if (typeof providerMessageId !== 'string' || providerMessageId.length === 0) {
      return res.status(400).json({ error: 'provider_message_id is required' });
    }

    try {
      const count = await diagnostics.getProviderEventCount(providerMessageId);
      return res.status(200).json({ provider_message_id: providerMessageId, count });
    } catch (_error) {
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  app.get('/v1/internal/dlq', async (req, res) => {
    if (!diagnostics.getDlqEntries) {
      return res.status(501).json({ error: 'not_configured' });
    }

    const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, Math.floor(rawLimit))) : 50;

    try {
      const entries = await diagnostics.getDlqEntries(limit);
      return res.status(200).json({ entries });
    } catch (_error) {
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  app.use(createIngestRouter(ingestionService));
  if (agentService) {
    app.use(createAgentRouter(agentService));
    app.use(createEvalRouter());
    app.use(createOpsRouter(agentService));
  }

  return app;
}
