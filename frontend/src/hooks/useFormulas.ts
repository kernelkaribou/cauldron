import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Formula, PaginatedResponse } from '@/lib/types';

export function useFormulas(page = 1, filters?: { craft_id?: number; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'craft,tags' });
  if (filters?.craft_id) params.set('craft_id', String(filters.craft_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['formulas', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Formula>>(`/formulas?${params}`),
  });
}

export function useFormula(id: number) {
  return useQuery({
    queryKey: ['formulas', id],
    queryFn: () => apiFetch<Formula>(`/formulas/${id}?expand=craft,tags`),
    enabled: !!id,
  });
}

export function useCreateFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Formula>('/formulas', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formulas'] }),
  });
}

export function useUpdateFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Formula>(`/formulas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['formulas'] });
      qc.invalidateQueries({ queryKey: ['formulas', id] });
    },
  });
}

export function useDeleteFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/formulas/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formulas'] }),
  });
}
