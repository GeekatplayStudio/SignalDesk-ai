import { z } from 'zod';

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid timestamp');

export const smsIngestSchema = z.object({
  tenant_id: z.string().min(1),
  From: z.string().min(1),
  To: z.string().min(1),
  Body: z.string().min(1),
  MessageSid: z.string().min(1),
  Timestamp: isoDateString.optional(),
});

export const chatIngestSchema = z.object({
  tenant_id: z.string().min(1),
  userId: z.string().min(1),
  message: z.string().min(1),
  chatId: z.string().min(1),
  timestamp: isoDateString.optional(),
  messageId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const voiceIngestSchema = z.object({
  tenant_id: z.string().min(1),
  callId: z.string().min(1),
  transcript_text: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1),
  duration: z.coerce.number().min(0).optional(),
  timestamp: isoDateString.optional(),
  segmentId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SmsIngestInput = z.infer<typeof smsIngestSchema>;
export type ChatIngestInput = z.infer<typeof chatIngestSchema>;
export type VoiceIngestInput = z.infer<typeof voiceIngestSchema>;
