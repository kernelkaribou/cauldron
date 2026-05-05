import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { createEntityHooks } from './createEntityHooks';
import type { Craft, CraftSupply, CraftTechnique } from '@/lib/types';

export interface CraftTechniqueInput {
  mode: 'existing';
  id: number;
  sort_order?: number;
  notes?: string;
}

export interface CraftSupplyInput {
  mode: 'existing';
  id: number;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export interface CraftPayload {
  title?: string;
  description?: string;
  category_id?: number | null;
  duration_minutes?: number;
  techniques?: CraftTechniqueInput[];
  supplies?: CraftSupplyInput[];
}

type CraftExpand = 'category' | 'tags' | 'techniques' | 'supplies';

const baseHooks = createEntityHooks<Craft>({
  entityKey: 'crafts',
  basePath: '/crafts',
  listExpand: 'category,tags',
  detailExpand: 'category,tags',
});

export const useCrafts = baseHooks.useList;
export const useDeleteCraft = baseHooks.useDelete;

// Custom detail hook that also fetches techniques/supplies from sub-routes
async function fetchCraftRelations(craftId: number, expand: CraftExpand[]) {
  const requests: Array<Promise<{ key: 'techniques' | 'supplies'; items: CraftTechnique[] | CraftSupply[] }>> = [];

  if (expand.includes('techniques')) {
    requests.push(
      apiFetch<{ items: CraftTechnique[] }>(`/crafts/${craftId}/techniques`).then(result => ({ key: 'techniques', items: result.items })),
    );
  }

  if (expand.includes('supplies')) {
    requests.push(
      apiFetch<{ items: CraftSupply[] }>(`/crafts/${craftId}/supplies`).then(result => ({ key: 'supplies', items: result.items })),
    );
  }

  return Promise.all(requests);
}

async function fetchCraftByExpand(id: number, expand: CraftExpand[]) {
  const requested: CraftExpand[] = expand.length > 0 ? expand : ['category', 'tags'];
  const params = new URLSearchParams({ expand: requested.join(',') });
  const craft = await apiFetch<Craft>(`/crafts/${id}?${params}`);
  const relations = await fetchCraftRelations(id, requested);

  return relations.reduce<Craft>((acc, relation) => ({
    ...acc,
    [relation.key]: relation.items,
  }), craft);
}

function getBaseCraftData(data: CraftPayload) {
  const base: Record<string, unknown> = {};
  if (data.title !== undefined) base.title = data.title;
  if (data.description !== undefined) base.description = data.description;
  if (data.category_id !== undefined) base.category_id = data.category_id;
  if (data.duration_minutes !== undefined) base.duration_minutes = data.duration_minutes;
  return base;
}

export function useCraft(id: number, expand: CraftExpand[] = ['category', 'tags']) {
  const expandKey = [...new Set(expand)].sort().join(',');
  const requested = (expandKey ? expandKey.split(',') : ['category', 'tags']) as CraftExpand[];

  return useQuery({
    queryKey: ['crafts', id, expandKey],
    queryFn: () => fetchCraftByExpand(id, requested),
    enabled: !!id,
  });
}

export function useCreateCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CraftPayload) => {
      const craft = await apiFetch<Craft>('/crafts', {
        method: 'POST',
        body: JSON.stringify({
          ...getBaseCraftData(data),
          techniques: data.techniques || [],
          supplies: data.supplies || [],
        }),
      });

      return fetchCraftByExpand(craft.id, ['category', 'tags', 'techniques', 'supplies']);
    },
    onSuccess: craft => {
      qc.invalidateQueries({ queryKey: ['crafts'] });
      qc.invalidateQueries({ queryKey: ['crafts', craft.id] });
    },
  });
}

export function useUpdateCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CraftPayload }) => {
      const payload: Record<string, unknown> = getBaseCraftData(data);
      if (data.techniques) payload.techniques = data.techniques;
      if (data.supplies) payload.supplies = data.supplies;

      await apiFetch<Craft>(`/crafts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      return fetchCraftByExpand(id, ['category', 'tags', 'techniques', 'supplies']);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['crafts'] });
      qc.invalidateQueries({ queryKey: ['crafts', id] });
    },
  });
}

export function useCreateCraftFromProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { project_id: number; title: string; description?: string; category_id?: number | null }) =>
      apiFetch<Craft>('/crafts/from-project', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crafts'] }),
  });
}
