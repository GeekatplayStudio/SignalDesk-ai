'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export function useRunEvals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/v1/evals/run`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to run evals (${res.status})`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eval-runs'] });
    },
  });
}
