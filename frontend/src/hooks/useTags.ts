import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Tag, PaginatedResponse } from '@/lib/types';

export type AggregatedTagSource = 'craft' | 'technique' | 'supply';

export interface AggregatedTag {
  id: number;
  name: string;
  sources: AggregatedTagSource[];
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => apiFetch<PaginatedResponse<Tag>>('/tags?per_page=100'),
  });
}

export function useAggregatedTags(craftId: number) {
  return useQuery({
    queryKey: ['crafts', craftId, 'all-tags'],
    queryFn: () => apiFetch<{ items: AggregatedTag[] }>(`/crafts/${craftId}/all-tags`),
    enabled: !!craftId,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}
