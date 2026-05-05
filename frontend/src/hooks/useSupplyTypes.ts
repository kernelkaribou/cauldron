import { createEntityHooks } from './createEntityHooks';
import type { SupplyType } from '@/lib/types';

const hooks = createEntityHooks<SupplyType>({
  entityKey: 'supply-types',
  basePath: '/supply-types',
});

export const useSupplyTypes = hooks.useList;
export const useSupplyType = hooks.useDetail;
export const useCreateSupplyType = hooks.useCreate;
export const useUpdateSupplyType = hooks.useUpdate;
export const useDeleteSupplyType = hooks.useDelete;
