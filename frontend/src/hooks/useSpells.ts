import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Spell, PaginatedResponse } from '@/lib/types';

export function useSpells(page = 1, filters?: { craft_id?: number; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'craft,tags' });
  if (filters?.craft_id) params.set('craft_id', String(filters.craft_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['spells', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Spell>>(`/spells?${params}`),
  });
}

export function useSpell(id: number) {
  return useQuery({
    queryKey: ['spells', id],
    queryFn: () => apiFetch<Spell>(`/spells/${id}?expand=craft,tags`),
    enabled: !!id,
  });
}

export function useCreateSpell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Spell>('/spells', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spells'] }),
  });
}

export function useUpdateSpell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Spell>(`/spells/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['spells'] });
      qc.invalidateQueries({ queryKey: ['spells', id] });
    },
  });
}

export function useDeleteSpell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/spells/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spells'] }),
  });
}
