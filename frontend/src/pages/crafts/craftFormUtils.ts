import type { CraftMaterial, CraftTechnique } from '@/lib/types';
import type { CraftMaterialInput, CraftTechniqueInput } from '@/hooks/useCrafts';

export interface TechniqueSelection {
  mode: 'existing';
  id: number;
  title: string;
  sort_order?: number;
  notes?: string;
}

export interface MaterialSelection {
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

export function mapCraftMaterialToSelection(material: CraftMaterial): MaterialSelection {
  return {
    mode: 'existing',
    id: material.material_id,
    name: material.name,
    quantity: material.quantity,
    unit: material.unit || undefined,
    notes: material.notes || undefined,
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

export function buildMaterialPayload(items: MaterialSelection[]): CraftMaterialInput[] {
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

export function areMaterialSelectionsEqual(a: MaterialSelection[], b: MaterialSelection[]) {
  return JSON.stringify(buildMaterialPayload(a)) === JSON.stringify(buildMaterialPayload(b));
}
