import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Technique, PaginatedResponse } from '@/lib/types';

export function useTechniques(page = 1, filters?: { craft_id?: number; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'craft,tags' });
  if (filters?.craft_id) params.set('craft_id', String(filters.craft_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['techniques', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Technique>>(`/techniques?${params}`),
  });
}

export function useTechnique(id: number) {
  return useQuery({
    queryKey: ['techniques', id],
    queryFn: () => apiFetch<Technique>(`/techniques/${id}?expand=craft,tags`),
    enabled: !!id,
  });
}

export function useCreateTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Technique>('/techniques', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['techniques'] }),
  });
}

export function useUpdateTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Technique>(`/techniques/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['techniques'] });
      qc.invalidateQueries({ queryKey: ['techniques', id] });
    },
  });
}

export function useDeleteTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/techniques/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['techniques'] }),
  });
}
