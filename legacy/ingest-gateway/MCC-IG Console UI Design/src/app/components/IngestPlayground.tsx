import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Terminal, Copy, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, Button, Input, Label, Badge } from './ui';
import { CodeBlock } from './ui/dashboard-elements';
import { toast } from 'sonner';
import { postIngest, toIsoTimestamp } from '../lib/api';
import { addActivity } from '../lib/activityStore';

type Channel = 'SMS' | 'CHAT' | 'VOICE';

type FormValues = {
  tenant_id?: string;
  timestamp?: string;
  From?: string;
  To?: string;
  Body?: string;
  MessageSid?: string;
  userId?: string;
  message?: string;
  chatId?: string;
  messageId?: string;
  metadata?: string;
  callId?: string;
  confidence?: string;
  duration?: string;
  transcript_text?: string;
  segmentId?: string;
};

export const IngestPlayground = () => {
  const [activeChannel, setActiveChannel] = useState<Channel>('SMS');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    data: unknown;
    path: string;
  } | null>(null);

  const { register, handleSubmit, reset, getValues } = useForm<FormValues>({
    defaultValues: {
      tenant_id: 't-retail-001',
      timestamp: new Date().toISOString().slice(0, 16),
    },
  });

  const endpointPath = useMemo(() => `/v1/ingest/${activeChannel.toLowerCase()}`, [activeChannel]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    try {
      const payload = buildPayload(activeChannel, data);
      const apiResponse = await postIngest(activeChannel.toLowerCase() as 'sms' | 'chat' | 'voice', payload);

      const statusLabel =
        apiResponse.status === 201
          ? 'Accepted'
          : apiResponse.status === 200
            ? 'Duplicate'
            : apiResponse.status === 429
              ? 'Rate Limited'
              : apiResponse.status === 400
                ? 'Validation Error'
                : 'Error';

      addActivity({
        channel: activeChannel,
        providerMessageId: resolveProviderMessageId(activeChannel, payload),
        tenantId: String(payload.tenant_id ?? 'unknown'),
        statusCode: apiResponse.status,
        statusLabel,
      });

      setResponse(apiResponse);

      if (apiResponse.status === 201) {
        toast.success('Message accepted and queued');
      } else if (apiResponse.status === 200) {
        toast.info('Duplicate detected and ignored');
      } else if (apiResponse.status === 429) {
        toast.warning('Rate limit exceeded for tenant');
      } else if (apiResponse.status === 400) {
        toast.error('Validation failed. Check your payload.');
      } else {
        toast.error(`Request failed (${apiResponse.status})`);
      }
    } catch (error) {
      setResponse({
        status: 500,
        statusText: 'Internal Error',
        data: { error: error instanceof Error ? error.message : 'Request failed' },
        path: endpointPath,
      });
      toast.error('Could not reach API');
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = async () => {
    const values = getValues();

    try {
      const payload = buildPayload(activeChannel, values);
      const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3005';
      const curl = `curl -X POST ${base.replace(/\/$/, '')}${endpointPath} -H 'content-type: application/json' -d '${JSON.stringify(payload)}'`;
      await navigator.clipboard.writeText(curl);
      toast.success('cURL copied to clipboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to copy cURL');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ingest Playground</h2>
        <p className="text-slate-400 text-sm">Send live requests to the MCC-IG API endpoints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-slate-800 p-6">
          <div className="flex p-1 bg-slate-900 rounded-lg mb-6 border border-slate-800">
            {(['SMS', 'CHAT', 'VOICE'] as Channel[]).map((channel) => (
              <button
                key={channel}
                onClick={() => {
                  setActiveChannel(channel);
                  setResponse(null);
                  reset({
                    tenant_id: getValues('tenant_id') ?? 't-retail-001',
                    timestamp: new Date().toISOString().slice(0, 16),
                  });
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  activeChannel === channel
                    ? 'bg-slate-800 text-cyan-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label>Tenant ID</Label>
                <Input {...register('tenant_id')} placeholder="e.g. t-retail-001" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Timestamp</Label>
                <Input {...register('timestamp')} type="datetime-local" />
              </div>
            </div>

            {activeChannel === 'SMS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From</Label>
                    <Input {...register('From')} placeholder="+1234567890" />
                  </div>
                  <div>
                    <Label>To</Label>
                    <Input {...register('To')} placeholder="+0987654321" />
                  </div>
                </div>
                <div>
                  <Label>Message Body</Label>
                  <textarea
                    {...register('Body')}
                    className="flex min-h-[80px] w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Enter SMS content..."
                  />
                </div>
                <div>
                  <Label>MessageSid (Twilio)</Label>
                  <Input {...register('MessageSid')} placeholder="SMxxxxxxxxxxxxxxxx" />
                </div>
              </div>
            )}

            {activeChannel === 'CHAT' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>User ID</Label>
                    <Input {...register('userId')} placeholder="user_123" />
                  </div>
                  <div>
                    <Label>Chat ID</Label>
                    <Input {...register('chatId')} placeholder="room_456" />
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <Input {...register('message')} placeholder="Hello there!" />
                </div>
                <div>
                  <Label>Message ID</Label>
                  <Input {...register('messageId')} placeholder="msg_789" />
                </div>
                <div>
                  <Label>Metadata (JSON)</Label>
                  <textarea
                    {...register('metadata')}
                    className="flex min-h-[60px] w-full rounded-md border border-border bg-input-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder='{"platform": "web", "browser": "chrome"}'
                  />
                </div>
              </div>
            )}

            {activeChannel === 'VOICE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Call ID</Label>
                    <Input {...register('callId')} placeholder="CAxxxxxxxx" />
                  </div>
                  <div>
                    <Label>Confidence</Label>
                    <Input {...register('confidence')} type="number" step="0.01" placeholder="0.98" />
                  </div>
                </div>
                <div>
                  <Label>Transcript Text</Label>
                  <Input {...register('transcript_text')} placeholder="Spoken text here..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (s)</Label>
                    <Input {...register('duration')} type="number" placeholder="12" />
                  </div>
                  <div>
                    <Label>Segment ID</Label>
                    <Input {...register('segmentId')} placeholder="seg_1" />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between gap-4">
              <Button type="button" variant="outline" className="flex-1 border-slate-700" onClick={copyCurl}>
                <Copy className="w-4 h-4 mr-2" />
                Copy cURL
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Request
              </Button>
            </div>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-800 min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-500" />
                <span className="font-bold text-xs uppercase tracking-wider">Response Panel</span>
              </div>
              {response && (
                <Badge
                  variant={
                    response.status === 201 ? 'success' : response.status === 200 ? 'warning' : 'error'
                  }
                >
                  {response.status} {response.statusText}
                </Badge>
              )}
            </div>

            <div className="flex-1 p-4 relative">
              {!response ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <Terminal className="w-12 h-12 opacity-10" />
                  <p className="text-sm">Submit the form to see response</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="text-cyan-500">POST</span>
                    <span>{response.path}</span>
                  </div>
                  <CodeBlock code={JSON.stringify(response.data, null, 2)} className="min-h-[250px]" />
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start gap-3">
                    {response.status === 201 ? (
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {response.status === 201 ? 'Ingestion Success' : 'Request Advisory'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {response.status === 201
                          ? 'Message was accepted and queued for processing.'
                          : response.status === 200
                            ? 'Message was recognized as a duplicate and ignored.'
                            : response.status === 429
                              ? 'Message was rejected because the tenant rate limit was exceeded.'
                              : 'Message was rejected due to validation or internal errors.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function buildPayload(channel: Channel, data: FormValues): Record<string, unknown> {
  const tenant_id = data.tenant_id?.trim() ?? '';
  const timestamp = toIsoTimestamp(data.timestamp);

  if (!tenant_id) {
    throw new Error('tenant_id is required');
  }

  if (channel === 'SMS') {
    const payload: Record<string, unknown> = {
      tenant_id,
      From: data.From?.trim() ?? '',
      To: data.To?.trim() ?? '',
      Body: data.Body?.trim() ?? '',
      MessageSid: data.MessageSid?.trim() ?? '',
    };

    if (timestamp) {
      payload.Timestamp = timestamp;
    }

    return payload;
  }

  if (channel === 'CHAT') {
    const payload: Record<string, unknown> = {
      tenant_id,
      userId: data.userId?.trim() ?? '',
      message: data.message?.trim() ?? '',
      chatId: data.chatId?.trim() ?? '',
    };

    if (timestamp) {
      payload.timestamp = timestamp;
    }

    if (data.messageId?.trim()) {
      payload.messageId = data.messageId.trim();
    }

    if (data.metadata?.trim()) {
      try {
        payload.metadata = JSON.parse(data.metadata);
      } catch (_error) {
        throw new Error('Metadata must be valid JSON');
      }
    }

    return payload;
  }

  const payload: Record<string, unknown> = {
    tenant_id,
    callId: data.callId?.trim() ?? '',
    transcript_text: data.transcript_text?.trim() ?? '',
    confidence: data.confidence ? Number(data.confidence) : 0,
  };

  if (timestamp) {
    payload.timestamp = timestamp;
  }

  if (data.duration?.trim()) {
    payload.duration = Number(data.duration);
  }

  if (data.segmentId?.trim()) {
    payload.segmentId = data.segmentId.trim();
  }

  return payload;
}

function resolveProviderMessageId(channel: Channel, payload: Record<string, unknown>): string {
  if (channel === 'SMS') {
    return String(payload.MessageSid ?? 'unknown');
  }

  if (channel === 'CHAT') {
    if (payload.messageId) {
      return String(payload.messageId);
    }

    return `${payload.chatId ?? 'chat'}:${payload.userId ?? 'user'}`;
  }

  const callId = String(payload.callId ?? 'call');
  const segmentId = payload.segmentId ? String(payload.segmentId) : '';
  return segmentId ? `${callId}:${segmentId}` : callId;
}
