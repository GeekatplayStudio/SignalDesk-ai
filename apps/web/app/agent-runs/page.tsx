'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { extractPlannerMeta, plannerBadgeClass, ToolCallRecord } from '@/lib/agentRunUtils';

type AgentRun = {
  id: string;
  conversationId: string;
  status: string;
  latencyMs?: number | null;
  createdAt: string;
  toolCalls: ToolCallRecord[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function AgentRunsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/agent/runs`);
      if (!res.ok) throw new Error(`Failed to fetch agent runs (${res.status})`);
      return (await res.json()) as { runs: AgentRun[] };
    },
  });

  const columns = useMemo<ColumnDef<AgentRun>[]>(
    () => [
      { header: 'Run', accessorKey: 'id' },
      {
        header: 'Conversation',
        accessorKey: 'conversationId',
        cell: ({ row }) => (
          <Link
            href={`/conversations/${row.original.conversationId}`}
            className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline"
          >
            {row.original.conversationId}
          </Link>
        ),
      },
      { header: 'Status', accessorKey: 'status' },
      {
        header: 'Latency',
        accessorKey: 'latencyMs',
        cell: (info) => (info.getValue<number | null>() ? `${info.getValue<number>()} ms` : '—'),
      },
      {
        header: 'Planner',
        cell: ({ row }) => {
          const meta = extractPlannerMeta(row.original.toolCalls[0]);
          return (
            <div className="flex flex-col gap-1">
              <span className={`inline-flex w-fit rounded px-2 py-0.5 text-xs ${plannerBadgeClass(meta.source)}`}>
                {meta.source}
              </span>
              {meta.model && <span className="text-[11px] text-slate-400">{meta.model}</span>}
            </div>
          );
        },
      },
      {
        header: 'Tool Calls',
        cell: ({ row }) =>
          row.original.toolCalls
            .map((t) => `${t.tool}${t.status === 'failed' ? ' (fail)' : ''}`)
            .join(', '),
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: (info) => new Date(info.getValue<string>()).toLocaleString(),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.runs ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Agent Runs</p>
        <h1 className="text-2xl font-semibold">Recent agent executions</h1>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-rose-400">Error: {(error as Error).message}</p>}

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="min-w-[700px] overflow-hidden rounded-xl border border-slate-800">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!isLoading && (data?.runs?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-slate-500">
                    No runs yet. Trigger /v1/agent/respond to create runs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
