'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Conversation = {
  id: string;
  title?: string | null;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function ConversationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/conversations`);
      if (!res.ok) throw new Error(`Failed to fetch conversations (${res.status})`);
      return (await res.json()) as { conversations: Conversation[] };
    },
  });

  const columns = useMemo<ColumnDef<Conversation>[]>(
    () => [
      {
        header: 'Conversation',
        accessorKey: 'id',
        cell: ({ row }) => (
          <Link
            href={`/conversations/${row.original.id}`}
            className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline"
          >
            {row.original.id}
          </Link>
        ),
      },
      { header: 'Title', accessorKey: 'title' },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: (info) => new Date(info.getValue<string>()).toLocaleString(),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.conversations ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Conversations</p>
        <h1 className="text-2xl font-semibold">All conversations</h1>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-rose-400">Error: {(error as Error).message}</p>}

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="min-w-[600px] overflow-hidden rounded-xl border border-slate-800">
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
              {!isLoading && (data?.conversations?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-slate-500">
                    No conversations yet. Send a message via /v1/agent/respond.
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
