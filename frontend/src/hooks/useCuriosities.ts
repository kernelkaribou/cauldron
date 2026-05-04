import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Curiosity, PaginatedResponse } from '@/lib/types';

export function useCuriosities(page = 1, filters?: { type?: string; category_id?: number; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'category,tags' });
  if (filters?.type) params.set('type', filters.type);
  if (filters?.category_id) params.set('category_id', String(filters.category_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['curiosities', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Curiosity>>(`/curiosities?${params}`),
  });
}

export function useCuriosity(id: number) {
  return useQuery({
    queryKey: ['curiosities', id],
    queryFn: () => apiFetch<Curiosity>(`/curiosities/${id}?expand=category,tags`),
    enabled: !!id,
  });
}

export function useCreateCuriosity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Curiosity>('/curiosities', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['curiosities'] }),
  });
}

export function useUpdateCuriosity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Curiosity>(`/curiosities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['curiosities'] });
      qc.invalidateQueries({ queryKey: ['curiosities', id] });
    },
  });
}

export function useDeleteCuriosity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/curiosities/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['curiosities'] }),
  });
}
