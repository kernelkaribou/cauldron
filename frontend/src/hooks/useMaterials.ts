import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Material, PaginatedResponse } from '@/lib/types';

export function useMaterials(page = 1, filters?: { search?: string; reusable?: number; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'tags' });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.reusable !== undefined) params.set('reusable', String(filters.reusable));
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['materials', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Material>>(`/materials?${params}`),
  });
}

export function useMaterial(id: number) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => apiFetch<Material>(`/materials/${id}?expand=tags`),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Material>('/materials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Material>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['materials', id] });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}
