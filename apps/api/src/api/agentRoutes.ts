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

  router.get('/v1/conversations', async (_req, res) => {
    const conversations = await agentService.getConversations();
    return res.json({ conversations });
  });

  router.get('/v1/conversations/:id', async (req, res) => {
    const conversation = await agentService.getConversation(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'not_found' });
    const [messages, runs] = await Promise.all([
      agentService.getMessages(req.params.id),
      agentService.getAgentRuns(req.params.id),
    ]);
    return res.json({ conversation, messages, runs });
  });

  router.get('/v1/agent/runs', async (_req, res) => {
    const runs = await agentService.getAgentRuns();
    return res.json({ runs });
  });

  return router;
}
