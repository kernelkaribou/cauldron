import { createEntityHooks } from './createEntityHooks';
import type { Technique } from '@/lib/types';

const hooks = createEntityHooks<Technique>({
  entityKey: 'techniques',
  basePath: '/techniques',
  listExpand: 'category,tags',
  detailExpand: 'category,tags',
});

export const useTechniques = hooks.useList;
export const useTechnique = hooks.useDetail;
export const useCreateTechnique = hooks.useCreate;
export const useUpdateTechnique = hooks.useUpdate;
export const useDeleteTechnique = hooks.useDelete;
