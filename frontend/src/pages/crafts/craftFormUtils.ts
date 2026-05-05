import type { CraftSupply, CraftTechnique } from '@/lib/types';
import type { CraftSupplyInput, CraftTechniqueInput } from '@/hooks/useCrafts';

export interface TechniqueSelection {
  mode: 'existing';
  id: number;
  title: string;
  sort_order?: number;
  notes?: string;
}

export interface SupplySelection {
  mode: 'existing';
  id: number;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export function mapCraftTechniqueToSelection(technique: CraftTechnique): TechniqueSelection {
  return {
    mode: 'existing',
    id: technique.technique_id,
    title: technique.title,
    sort_order: technique.sort_order,
    notes: technique.notes || undefined,
  };
}

export function mapCraftSupplyToSelection(supply: CraftSupply): SupplySelection {
  return {
    mode: 'existing',
    id: supply.supply_id,
    name: supply.name,
    quantity: supply.quantity,
    unit: supply.unit || undefined,
    notes: supply.notes || undefined,
  };
}

export function buildTechniquePayload(items: TechniqueSelection[]): CraftTechniqueInput[] {
  return items.map((item, index) => ({
    mode: 'existing',
    id: item.id,
    sort_order: index,
    ...(item.notes?.trim() ? { notes: item.notes.trim() } : {}),
  }));
}

export function buildSupplyPayload(items: SupplySelection[]): CraftSupplyInput[] {
  return items.map(item => ({
    mode: 'existing',
    id: item.id,
    ...(item.quantity !== undefined ? { quantity: item.quantity } : {}),
    ...(item.unit?.trim() ? { unit: item.unit.trim() } : {}),
    ...(item.notes?.trim() ? { notes: item.notes.trim() } : {}),
  }));
}

export function areTechniqueSelectionsEqual(a: TechniqueSelection[], b: TechniqueSelection[]) {
  return JSON.stringify(buildTechniquePayload(a)) === JSON.stringify(buildTechniquePayload(b));
}

export function areSupplySelectionsEqual(a: SupplySelection[], b: SupplySelection[]) {
  return JSON.stringify(buildSupplyPayload(a)) === JSON.stringify(buildSupplyPayload(b));
}
