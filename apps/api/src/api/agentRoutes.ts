import { Router } from 'express';
import { AgentService, agentRespondSchema } from '../core/agentService';

export function createAgentRouter(agentService: AgentService): Router {
  const router = Router();

  router.post('/v1/agent/respond', async (req, res) => {
    const parsed = agentRespondSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const run = await agentService.respond(parsed.data);
      return res.status(200).json({ run });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  router.get('/v1/conversations', (_req, res) => {
    return res.json({ conversations: agentService.getConversations() });
  });

  router.get('/v1/conversations/:id', (req, res) => {
    const conversation = agentService.getConversation(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'not_found' });
    return res.json({ conversation, messages: agentService.getMessages(req.params.id), runs: agentService.getAgentRuns(req.params.id) });
  });

  router.get('/v1/agent/runs', (_req, res) => {
    return res.json({ runs: agentService.getAgentRuns() });
  });

  return router;
}
