import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Craft, CraftMaterial, CraftTechnique, PaginatedResponse } from '@/lib/types';

export interface CraftTechniqueInput {
  mode: 'existing';
  id: number;
  sort_order?: number;
  notes?: string;
}

export interface CraftMaterialInput {
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
  materials?: CraftMaterialInput[];
}

type CraftExpand = 'category' | 'tags' | 'techniques' | 'materials';

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

async function fetchCraftRelations(craftId: number, expand: CraftExpand[]) {
  const requests: Array<Promise<{ key: 'techniques' | 'materials'; items: CraftTechnique[] | CraftMaterial[] }>> = [];

  if (expand.includes('techniques')) {
    requests.push(
      apiFetch<{ items: CraftTechnique[] }>(`/crafts/${craftId}/techniques`).then(result => ({ key: 'techniques', items: result.items })),
    );
  }

  if (expand.includes('materials')) {
    requests.push(
      apiFetch<{ items: CraftMaterial[] }>(`/crafts/${craftId}/materials`).then(result => ({ key: 'materials', items: result.items })),
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

async function replaceCraftTechniques(craftId: number, techniques: CraftTechniqueInput[]) {
  const existing = await apiFetch<{ items: CraftTechnique[] }>(`/crafts/${craftId}/techniques`);

  await Promise.all(
    existing.items.map(item => apiFetch(`/crafts/${craftId}/techniques/${item.technique_id}`, { method: 'DELETE' })),
  );

  for (const technique of techniques) {
    await apiFetch(`/crafts/${craftId}/techniques`, {
      method: 'POST',
      body: JSON.stringify({
        technique_id: technique.id,
        sort_order: technique.sort_order ?? 0,
        notes: technique.notes,
      }),
    });
  }
}

async function replaceCraftMaterials(craftId: number, materials: CraftMaterialInput[]) {
  const existing = await apiFetch<{ items: CraftMaterial[] }>(`/crafts/${craftId}/materials`);

  await Promise.all(
    existing.items.map(item => apiFetch(`/crafts/${craftId}/materials/${item.material_id}`, { method: 'DELETE' })),
  );

  for (const material of materials) {
    await apiFetch(`/crafts/${craftId}/materials`, {
      method: 'POST',
      body: JSON.stringify({
        material_id: material.id,
        quantity: material.quantity ?? 0,
        unit: material.unit,
        notes: material.notes,
      }),
    });
  }
}

async function syncCraftRelations(craftId: number, data: Pick<CraftPayload, 'techniques' | 'materials'>) {
  await Promise.all([
    data.techniques ? replaceCraftTechniques(craftId, data.techniques) : Promise.resolve(),
    data.materials ? replaceCraftMaterials(craftId, data.materials) : Promise.resolve(),
  ]);
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
        body: JSON.stringify(getBaseCraftData(data)),
      });

      await syncCraftRelations(craft.id, data);
      return fetchCraftByExpand(craft.id, ['category', 'tags', 'techniques', 'materials']);
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
      const baseData = getBaseCraftData(data);
      if (Object.keys(baseData).length > 0) {
        await apiFetch<Craft>(`/crafts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(baseData),
        });
      }

      await syncCraftRelations(id, data);
      return fetchCraftByExpand(id, ['category', 'tags', 'techniques', 'materials']);
    },
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
