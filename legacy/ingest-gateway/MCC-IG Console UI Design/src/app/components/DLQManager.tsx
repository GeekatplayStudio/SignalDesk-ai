import React, { useEffect, useMemo, useState } from 'react';
import {
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
  X,
  AlertCircle,
  FileJson,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge, Input, Select, cn } from './ui';
import { CodeBlock } from './ui/dashboard-elements';
import { toast } from 'sonner';
import { getDlqEntries, type DlqEntry } from '../lib/api';

export const DLQManager = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<DlqEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await getDlqEntries(100);
      if (response.status === 200) {
        const data = response.data as { entries?: DlqEntry[] };
        setEntries(Array.isArray(data.entries) ? data.entries : []);
      } else if (response.status === 501) {
        setEntries([]);
      } else {
        toast.error(`Failed to load DLQ entries (${response.status})`);
      }
    } catch (_error) {
      toast.error('Unable to load DLQ entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const rows = useMemo(() => {
    const normalized = entries.map((entry, index) => {
      const event = entry.event ?? {};
      const providerId = String(event.provider_message_id ?? `entry-${index}`);
      const tenantId = String(event.tenant_id ?? 'unknown');
      const error = String(entry.error ?? 'processing_error');
      const retries = Number(entry.retries ?? 0);
      const failedAt = String(entry.failed_at ?? 'unknown');

      return {
        key: `${providerId}-${index}`,
        providerId,
        tenantId,
        error,
        retries,
        failedAt,
        payload: entry,
      };
    });

    if (!filterText.trim()) {
      return normalized;
    }

    const term = filterText.trim().toLowerCase();
    return normalized.filter(
      (row) => row.providerId.toLowerCase().includes(term) || row.tenantId.toLowerCase().includes(term),
    );
  }, [entries, filterText]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRequeue = (id: string) => {
    toast.info(`Requeue action not implemented yet for ${id}`);
  };

  const handleDismiss = (id: string) => {
    toast.info(`Dismiss action not implemented yet for ${id}`);
  };

  const exportJson = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcc-ig-dlq-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">DLQ & Failures</h2>
          <p className="text-slate-400 text-sm">Inspect dead-letter queue entries from Redis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-700" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700" onClick={exportJson}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="destructive" size="sm" disabled>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card className="border-slate-800">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Filter by Provider ID or Tenant..."
                className="pl-10"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
          <Select className="w-40" disabled>
            <option>All Channels</option>
          </Select>
          <Select className="w-40" disabled>
            <option>All Errors</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 font-medium bg-slate-900/40 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Failed At</th>
                <th className="px-6 py-4">Provider ID</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Retries</th>
                <th className="px-6 py-4">Error</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-500">
                    No DLQ entries found (or internal DLQ endpoint is not configured).
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <React.Fragment key={row.key}>
                  <tr
                    className={cn(
                      'hover:bg-slate-900/40 transition-colors cursor-pointer',
                      expandedId === row.key && 'bg-slate-900/60',
                    )}
                    onClick={() => toggleExpand(row.key)}
                  >
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{row.failedAt}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{row.providerId}</td>
                    <td className="px-6 py-4 text-slate-300">{row.tenantId}</td>
                    <td className="px-6 py-4">
                      <Badge variant={row.retries >= 3 ? 'error' : 'warning'}>{row.retries}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                        <span className="text-destructive font-medium">{row.error}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-cyan-500 hover:bg-cyan-500/10"
                          onClick={() => handleRequeue(row.providerId)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:bg-slate-500/10"
                          onClick={() => handleDismiss(row.providerId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <button className="p-1 text-slate-600 hover:text-slate-300">
                          {expandedId === row.key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === row.key && (
                    <tr className="bg-slate-950/50">
                      <td colSpan={6} className="px-6 py-6 animate-in slide-in-from-top-2 duration-200">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileJson className="w-4 h-4 text-cyan-500" />
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Raw DLQ JSON</span>
                          </div>
                          <CodeBlock code={JSON.stringify(row.payload, null, 2)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
