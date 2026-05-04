import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Craft, PaginatedResponse } from '@/lib/types';

export function useCrafts() {
  return useQuery({
    queryKey: ['crafts'],
    queryFn: () => apiFetch<PaginatedResponse<Craft>>('/crafts?per_page=100'),
  });
}

export function useCreateCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Craft>('/crafts', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crafts'] }),
  });
}
