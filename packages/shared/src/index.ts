import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.date(),
});

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  title: z.string().optional(),
  createdAt: z.date(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  createdAt: z.date(),
});

export const IngestEventSchema = z.object({
  id: z.string().uuid(),
  providerMessageId: z.string(),
  channel: z.enum(['sms', 'chat', 'voice']),
  payload: z.any(),
  createdAt: z.date(),
});

export const AgentRunSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'succeeded', 'failed']),
  latencyMs: z.number().optional(),
  createdAt: z.date(),
});

export const ToolCallSchema = z.object({
  id: z.string().uuid(),
  agentRunId: z.string().uuid(),
  tool: z.string(),
  status: z.enum(['pending', 'running', 'succeeded', 'failed']),
  request: z.any(),
  response: z.any().optional(),
  latencyMs: z.number().optional(),
  createdAt: z.date(),
});

export const EvalSuiteSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  version: z.string(),
  createdAt: z.date(),
});

export const EvalRunSchema = z.object({
  id: z.string().uuid(),
  suiteId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'passed', 'failed']),
  passRate: z.number().optional(),
  createdAt: z.date(),
});

export const EvalCaseSchema = z.object({
  id: z.string().uuid(),
  suiteId: z.string().uuid(),
  name: z.string(),
  prompt: z.string(),
  expected: z.string().optional(),
});

export const GuardrailViolationSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  detail: z.string(),
  createdAt: z.date(),
});

export const MetricPointSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.number(),
  labels: z.record(z.string()).optional(),
  timestamp: z.date(),
});

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.enum(['scheduled', 'running', 'completed', 'failed']),
  createdAt: z.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type IngestEvent = z.infer<typeof IngestEventSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type EvalSuite = z.infer<typeof EvalSuiteSchema>;
export type EvalRun = z.infer<typeof EvalRunSchema>;
export type EvalCase = z.infer<typeof EvalCaseSchema>;
export type GuardrailViolation = z.infer<typeof GuardrailViolationSchema>;
export type MetricPoint = z.infer<typeof MetricPointSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
