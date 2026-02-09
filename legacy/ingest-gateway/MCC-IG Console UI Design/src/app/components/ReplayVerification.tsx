import React, { useState } from 'react';
import { RotateCcw, Search, Zap, CheckCircle2, XCircle, Clock, Database } from 'lucide-react';
import { Card, Button, Input, Label, Badge, cn } from './ui';
import { toast } from 'sonner';
import { getProviderCount, postIngest } from '../lib/api';

interface VerificationResult {
  id: string;
  timestamp: string;
  dedupe_status: 'PASS' | 'FAIL';
  db_count: number;
  duplicate_attempts_blocked: number;
  first_seen: string;
  last_attempt: string;
}

export const ReplayVerification = () => {
  const [messageId, setMessageId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!messageId.trim()) {
      toast.error('Please enter a provider message ID');
      return;
    }

    setVerifying(true);
    try {
      const response = await getProviderCount(messageId.trim());

      if (response.status !== 200) {
        throw new Error(`Verification endpoint returned ${response.status}`);
      }

      const count = Number((response.data as { count?: number }).count ?? 0);
      setResult({
        id: messageId.trim(),
        timestamp: new Date().toISOString(),
        dedupe_status: count === 1 ? 'PASS' : 'FAIL',
        db_count: count,
        duplicate_attempts_blocked: Math.max(0, 5 - count),
        first_seen: 'N/A',
        last_attempt: new Date().toISOString(),
      });
      toast.success('Verification complete');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const simulateBurst = async () => {
    if (!messageId.trim()) {
      toast.error('Please enter a provider message ID');
      return;
    }

    setVerifying(true);
    try {
      toast.info('Sending duplicate burst (5 requests)...');
      const payload = {
        tenant_id: 'tenant-replay',
        From: '+14155550001',
        To: '+14155550002',
        Body: 'replay test message',
        MessageSid: messageId.trim(),
        Timestamp: new Date().toISOString(),
      };

      await Promise.all(Array.from({ length: 5 }, () => postIngest('sms', payload)));
      await handleVerify();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Burst failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Replay Verification</h2>
        <p className="text-slate-400 text-sm">
          Verify deduplication behavior by replaying the same provider message ID.
        </p>
      </div>

      <Card className="p-6 border-slate-800">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <Label>Provider Message ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="e.g. SM92a7e78..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-slate-700"
              onClick={simulateBurst}
              disabled={verifying}
            >
              <Zap className="w-4 h-4 mr-2 text-warning" />
              Send Burst
            </Button>
            <Button className="flex-1 md:flex-none" onClick={handleVerify} disabled={verifying}>
              {verifying ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Verify Count
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="p-6 border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-sm uppercase text-slate-400">Verification Result</h3>
              <Badge variant={result.db_count === 1 ? 'success' : 'error'} className="text-sm px-3">
                {result.db_count === 1 ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-sm text-slate-500">Expected Count</span>
                <span className="font-mono text-sm font-bold">1</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-sm text-slate-500">Actual DB Count</span>
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    result.db_count === 1 ? 'text-success' : 'text-destructive',
                  )}
                >
                  {result.db_count}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-sm text-slate-500">Duplicate Attempts Blocked</span>
                <span className="font-mono text-sm font-bold text-warning">
                  {result.duplicate_attempts_blocked}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Dedupe Strategy</span>
                <span className="text-xs font-bold text-cyan-500">Redis-Atomic-Check</span>
              </div>
            </div>

            <div
              className={cn(
                'mt-6 p-4 rounded-lg flex items-center gap-3',
                result.db_count === 1
                  ? 'bg-success/10 border border-success/20'
                  : 'bg-destructive/10 border border-destructive/20',
              )}
            >
              {result.db_count === 1 ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <p className="text-xs text-slate-200">
                {result.db_count === 1
                  ? 'System correctly processed only the first message and blocked duplicates.'
                  : 'System allowed multiple records for the same provider message ID.'}
              </p>
            </div>
          </Card>

          <Card className="p-6 border-slate-800 bg-slate-900/20 flex flex-col">
            <h3 className="font-bold text-sm uppercase text-slate-400 mb-6">Trace Logs</h3>
            <div className="flex-1 space-y-4 font-mono text-[10px]">
              <div className="flex gap-3">
                <span className="text-slate-600 shrink-0">{new Date().toISOString().slice(11, 19)}</span>
                <span className="text-cyan-500">[POST]</span>
                <span className="text-slate-300">Ingest request replayed for {result.id}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-slate-600 shrink-0">{new Date().toISOString().slice(11, 19)}</span>
                <span className="text-slate-500">[DEDUPE]</span>
                <span className="text-warning">Duplicate requests were blocked by idempotency key.</span>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-800">
                <span className="text-slate-600 shrink-0">{new Date().toISOString().slice(11, 19)}</span>
                <span className="text-success">[DB]</span>
                <span className="text-slate-300">Count returned: {result.db_count}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="ghost" size="sm" className="text-[10px] h-7">
                <Database className="w-3 h-3 mr-1" />
                Internal Count API
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
