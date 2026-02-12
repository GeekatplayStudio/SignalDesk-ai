import { z } from 'zod';

export const agentRespondSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  message: z.string().min(1),
});

export type AgentRespondInput = z.infer<typeof agentRespondSchema>;
