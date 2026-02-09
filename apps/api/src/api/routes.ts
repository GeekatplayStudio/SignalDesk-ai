import { RequestHandler, Router } from 'express';
import { IngestionService } from '../core/ingestionService';
import { normalizeChat, normalizeSms, normalizeVoice } from '../core/normalize';
import { chatIngestSchema, smsIngestSchema, voiceIngestSchema } from '../core/schemas';
import { createIngestHandler } from './controllers/ingestController';

export function createIngestRouter(ingestionService: IngestionService): Router {
  const router = Router();

  registerIngestRoute(
    router,
    ['/v1/ingest/sms', '/ingest/sms'],
    createIngestHandler(smsIngestSchema, normalizeSms, ingestionService),
  );
  registerIngestRoute(
    router,
    ['/v1/ingest/chat', '/ingest/chat'],
    createIngestHandler(chatIngestSchema, normalizeChat, ingestionService),
  );
  registerIngestRoute(
    router,
    ['/v1/ingest/voice', '/ingest/voice'],
    createIngestHandler(voiceIngestSchema, normalizeVoice, ingestionService),
  );

  return router;
}

function registerIngestRoute(router: Router, paths: string[], handler: RequestHandler): void {
  for (const path of paths) {
    router.post(path, handler);
  }
}
