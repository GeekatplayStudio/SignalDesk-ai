'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';

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
      { header: 'Conversation', accessorKey: 'id' },
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

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 text-slate-300">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 text-left font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-900">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 text-slate-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!isLoading && (data?.conversations?.length ?? 0) === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={columns.length}>
                  No conversations yet. Send a message via /v1/agent/respond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
