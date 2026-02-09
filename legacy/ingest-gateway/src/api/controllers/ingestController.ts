import { RequestHandler, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';
import { IngestionService } from '../../core/ingestionService';
import { ConversationEvent, IngestResult } from '../../core/types';

export function createIngestHandler<TSchema extends ZodTypeAny>(
  schema: TSchema,
  normalize: (payload: z.infer<TSchema>) => ConversationEvent,
  ingestionService: IngestionService,
): RequestHandler {
  return async (req, res) => {
    try {
      const payload = schema.parse(req.body);
      const event = normalize(payload);
      const result = await ingestionService.ingest(event);
      return respondIngestResult(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'validation_error',
          details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        });
      }

      return res.status(500).json({ error: 'internal_error' });
    }
  };
}

function respondIngestResult(res: Response, result: IngestResult): Response {
  if (result.status === 'duplicate') {
    return res.status(200).json({ status: 'duplicate' });
  }

  if (result.status === 'rate_limited') {
    return res.status(429).json({ error: 'rate limit exceeded' });
  }

  return res.status(201).json({ status: 'accepted', event_id: result.eventId });
}
