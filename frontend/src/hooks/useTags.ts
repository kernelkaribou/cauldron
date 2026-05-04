import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Tag, PaginatedResponse } from '@/lib/types';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => apiFetch<PaginatedResponse<Tag>>('/tags?per_page=100'),
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
