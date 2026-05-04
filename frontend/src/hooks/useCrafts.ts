import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Craft, PaginatedResponse } from '@/lib/types';

export function useCrafts(page = 1, filters?: { category_id?: number; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'category,tags' });
  if (filters?.category_id) params.set('category_id', String(filters.category_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['crafts', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Craft>>(`/crafts?${params}`),
  });
}

export function useCraft(id: number) {
  return useQuery({
    queryKey: ['crafts', id],
    queryFn: () => apiFetch<Craft>(`/crafts/${id}?expand=category,tags`),
    enabled: !!id,
  });
}

export function useCreateCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Craft>('/crafts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crafts'] }),
  });
}

export function useUpdateCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Craft>(`/crafts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['crafts'] });
      qc.invalidateQueries({ queryKey: ['crafts', id] });
    },
  });
}

export function useDeleteCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/crafts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crafts'] }),
  });
}
