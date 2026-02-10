'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ToolCall = { tool: string; status: string };
type AgentRun = {
  id: string;
  conversationId: string;
  status: string;
  latencyMs?: number | null;
  createdAt: string;
  toolCalls: ToolCall[];
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
      { header: 'Conversation', accessorKey: 'conversationId' },
      { header: 'Status', accessorKey: 'status' },
      {
        header: 'Latency',
        accessorKey: 'latencyMs',
        cell: (info) => (info.getValue<number | null>() ? `${info.getValue<number>()} ms` : '—'),
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
