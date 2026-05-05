import { createEntityHooks } from './createEntityHooks';
import type { SupplyProfile } from '@/lib/types';

const hooks = createEntityHooks<SupplyProfile>({
  entityKey: 'supply-profiles',
  basePath: '/supply-profiles',
});

export const useSupplyProfiles = hooks.useList;
export const useSupplyProfile = hooks.useDetail;
export const useCreateSupplyProfile = hooks.useCreate;
export const useUpdateSupplyProfile = hooks.useUpdate;
export const useDeleteSupplyProfile = hooks.useDelete;
