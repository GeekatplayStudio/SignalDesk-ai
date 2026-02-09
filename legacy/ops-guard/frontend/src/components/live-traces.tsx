"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import useSWR from "swr";
import { useState } from "react";
import { cn } from "./ui/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LiveTracesProps {
  filterErrorsOnly: boolean;
}

interface TraceLog {
  timestamp: string;
  msg: string;
  trace_id: string;
  duration: number;
  level: "info" | "error";
  error?: string;
}

export function LiveTraces({ filterErrorsOnly }: LiveTracesProps) {
  const { data: traces = [] } = useSWR<TraceLog[]>("http://localhost:3001/traces", fetcher, { refreshInterval: 2000 });
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const filteredTraces = filterErrorsOnly
    ? traces.filter((t) => t.level === "error")
    : traces;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h3 className="font-mono text-sm font-semibold text-slate-200">Live Traces & Logs</h3>
        <Badge variant="outline" className="border-slate-700 text-slate-400">Live Polling</Badge>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="bg-slate-950/80 sticky top-0 z-10">
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableHead className="font-mono text-xs w-[100px]">Trace ID</TableHead>
                <TableHead className="font-mono text-xs">Method</TableHead>
                <TableHead className="font-mono text-xs">Status</TableHead>
                <TableHead className="font-mono text-xs text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTraces.map((trace) => (
                <TableRow 
                  key={trace.trace_id + trace.timestamp} 
                  className={cn(
                    "border-slate-800 font-mono text-xs cursor-pointer transition-colors",
                    trace.level === 'error' ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-800/50',
                    selectedTraceId === trace.trace_id && 'bg-slate-800'
                  )}
                  onClick={() => setSelectedTraceId(trace.trace_id)}
                >
                  <TableCell className="font-medium text-slate-400">
                    {trace.trace_id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    POST /process-payment
                  </TableCell>
                  <TableCell>
                     {trace.level === 'error' ? (
                      <Badge variant="destructive" className="bg-rose-900 text-rose-200 hover:bg-rose-900 border-none text-[10px]">
                        500 Error
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-900/50 text-emerald-400 bg-emerald-950/10 text-[10px]">
                        200 OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right", trace.duration > 1000 ? 'text-amber-400' : 'text-slate-400')}>
                    {trace.duration}ms
                  </TableCell>
                </TableRow>
              ))}
              {filteredTraces.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                         {traces.length === 0 ? "Waiting for requests..." : "No errors detected."}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {selectedTraceId && (
        <div className="h-1/3 border-t border-slate-800 p-4 bg-slate-950">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trace Details</h4>
                <button onClick={() => setSelectedTraceId(null)} className="text-slate-500 hover:text-slate-300 text-xs">Close</button>
            </div>
             <div className="space-y-1 font-mono text-xs">
                {(() => {
                    const t = traces.find(tr => tr.trace_id === selectedTraceId);
                    if (!t) return null;
                    return (
                        <>
                            <div className="text-slate-300">Log Message: <span className="text-slate-400">{t.msg}</span></div>
                            <div className="text-slate-300">Error: <span className="text-rose-400">{t.error || 'None'}</span></div>
                            <div className="text-slate-300">Full ID: <span className="text-slate-500">{t.trace_id}</span></div>
                        </>
                    )
                })()}
             </div>
        </div>
      )}
    </div>
  );
}
