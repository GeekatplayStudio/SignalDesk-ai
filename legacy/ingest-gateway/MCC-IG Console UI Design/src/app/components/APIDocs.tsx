import React from 'react';
import { HelpCircle, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Card, cn } from './ui';
import { CodeBlock } from './ui/dashboard-elements';

export const APIDocs = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Docs Lite</h2>
        <p className="text-slate-400 text-sm">Quick reference for integration endpoints and status codes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="hidden lg:block space-y-1 sticky top-24 h-fit">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Endpoints</p>
          <a href="#sms" className="block px-3 py-2 text-sm text-cyan-500 font-medium hover:bg-slate-900 rounded-md">
            POST /v1/ingest/sms
          </a>
          <a href="#chat" className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md">
            POST /v1/ingest/chat
          </a>
          <a href="#voice" className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md">
            POST /v1/ingest/voice
          </a>
          <a href="#internal" className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md">
            Internal Endpoints
          </a>
          <a href="#status" className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md">
            Status Codes
          </a>
        </div>

        <div className="lg:col-span-3 space-y-12">
          <section id="sms" className="scroll-mt-24 space-y-4">
            <h3 className="text-lg font-bold">POST /v1/ingest/sms</h3>
            <CodeBlock
              code={`{
  "tenant_id": "t-retail-001",
  "From": "+1234567890",
  "To": "+0987654321",
  "Body": "Hello from customer",
  "MessageSid": "SM92a7e78...",
  "Timestamp": "2026-02-09T14:45:12Z"
}`}
            />
          </section>

          <section id="chat" className="scroll-mt-24 space-y-4">
            <h3 className="text-lg font-bold">POST /v1/ingest/chat</h3>
            <CodeBlock
              code={`{
  "tenant_id": "tenant-chat",
  "userId": "user_123",
  "message": "Hello there",
  "chatId": "room_456",
  "timestamp": "2026-02-09T14:45:12Z",
  "messageId": "msg_789"
}`}
            />
          </section>

          <section id="voice" className="scroll-mt-24 space-y-4">
            <h3 className="text-lg font-bold">POST /v1/ingest/voice</h3>
            <CodeBlock
              code={`{
  "tenant_id": "tenant-voice",
  "callId": "call_123",
  "transcript_text": "Spoken text",
  "confidence": 0.98,
  "duration": 12,
  "timestamp": "2026-02-09T14:45:12Z"
}`}
            />
          </section>

          <section id="internal" className="scroll-mt-24 space-y-4">
            <h3 className="text-lg font-bold">Internal Endpoints</h3>
            <CodeBlock
              code={`GET /health
GET /v1/internal/events/count?provider_message_id=...
GET /v1/internal/dlq?limit=50`}
            />
          </section>

          <section id="status" className="scroll-mt-24 space-y-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-bold">Status Code Legend</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { code: '201', label: 'Accepted', desc: 'Message accepted and queued.', icon: CheckCircle2, color: 'text-success' },
                { code: '200', label: 'Duplicate', desc: 'Message already exists and was ignored.', icon: AlertTriangle, color: 'text-warning' },
                { code: '429', label: 'Rate Limited', desc: 'Too many requests for tenant.', icon: XCircle, color: 'text-destructive' },
                { code: '400', label: 'Bad Request', desc: 'Validation failed.', icon: XCircle, color: 'text-destructive' },
              ].map((item) => (
                <div key={item.code} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start gap-4">
                  <item.icon className={cn('w-5 h-5 mt-0.5', item.color)} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-100">{item.code}</span>
                      <span className="text-xs font-medium text-slate-500 uppercase">{item.label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-bold">Quick Troubleshooting</h3>
            </div>
            <p className="text-sm text-slate-300">
              Use Ingest Playground to send requests, Replay Verification to test idempotency, and DLQ tab to inspect
              worker failures.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
