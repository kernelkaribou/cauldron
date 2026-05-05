import { z } from 'zod';
import { createCrudRouter } from './crud.js';
import { deleteNotesForEntity, deletePhotosForEntity } from './entity-utils.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  material: z.string().max(100).optional(),
  brand: z.string().max(200).optional(),
  unit: z.string().max(50).optional(),
  reusable: z.number().int().min(0).max(1).optional(),
  price: z.number().min(0).optional(),
  profile_id: z.number().int().positive().nullable().optional(),
  attributes: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  material: z.string().max(100).optional(),
  brand: z.string().max(200).optional(),
  unit: z.string().max(50).optional(),
  reusable: z.number().int().min(0).max(1).optional(),
  price: z.number().min(0).optional(),
  profile_id: z.number().int().positive().nullable().optional(),
  attributes: z.string().optional(),
});

interface ProfileRow { id: number; schema: string; owner_id: number }
interface ProfileField { key: string; type: string; options?: string[]; unit?: string; integer?: boolean; min?: number; max?: number; required?: boolean }

function validateAttributesAgainstProfile(
  db: ReturnType<typeof import('../db.js').getDb>,
  data: Record<string, any>,
  ownerId: number,
  existing?: Record<string, any>
): string | null {
  // Resolve the effective state by merging existing row with patch
  const effectiveProfileId = data.profile_id !== undefined ? data.profile_id : existing?.profile_id ?? null;
  const effectiveAttributes = data.attributes !== undefined ? data.attributes : existing?.attributes ?? null;

  // If clearing profile_id, also clear attributes
  if (effectiveProfileId === null || effectiveProfileId === undefined) {
    if (effectiveAttributes && effectiveAttributes !== '{}' && effectiveAttributes !== null) {
      // On update: if user is setting profile_id to null, auto-clear attributes
      if (data.profile_id === null && existing?.attributes) {
        data.attributes = '{}';
      } else if (!existing) {
        // On create: reject attributes without profile
        return 'Attributes require a profile_id';
      }
    }
    return null;
  }

  // Verify profile exists and is owned by this user
  const profile = db.prepare(
    'SELECT id, schema, owner_id FROM supply_profiles WHERE id = ? AND owner_id = ?'
  ).get(effectiveProfileId, ownerId) as ProfileRow | undefined;

  if (!profile) {
    return 'Profile not found or not owned by you';
  }

  // Determine which attributes to validate (patch or existing)
  const attrStr = data.attributes !== undefined ? data.attributes : existing?.attributes ?? null;
  if (!attrStr || attrStr === '{}' || attrStr === null) {
    // Check if any required fields exist in the profile
    const fields: ProfileField[] = JSON.parse(profile.schema);
    const hasRequired = fields.some(f => f.required);
    if (hasRequired) {
      return `Profile "${profile.id}" has required fields that must be provided`;
    }
    return null;
  }

  // Parse and validate attributes
  let attrs: Record<string, any>;
  try {
    attrs = JSON.parse(attrStr);
  } catch {
    return 'Invalid attributes JSON';
  }

  if (typeof attrs !== 'object' || Array.isArray(attrs) || attrs === null) {
    return 'Attributes must be a JSON object';
  }

  const fields: ProfileField[] = JSON.parse(profile.schema);
  const validKeys = new Set(fields.map(f => f.key));

  // Check all attribute keys are defined in profile
  for (const key of Object.keys(attrs)) {
    if (!validKeys.has(key)) {
      return `Unknown attribute key: "${key}"`;
    }
  }

  // Type validation for each field
  for (const field of fields) {
    const val = attrs[field.key];
    if (val === undefined || val === null) {
      if (field.required) return `"${field.key}" is required`;
      continue;
    }

    switch (field.type) {
      case 'text':
        if (typeof val !== 'string') return `"${field.key}" must be text`;
        if (field.required && val === '') return `"${field.key}" is required`;
        break;
      case 'number':
        if (typeof val !== 'number') return `"${field.key}" must be a number`;
        if (field.integer && !Number.isInteger(val)) return `"${field.key}" must be a whole number`;
        if (field.min !== undefined && val < field.min) return `"${field.key}" must be at least ${field.min}`;
        if (field.max !== undefined && val > field.max) return `"${field.key}" must be at most ${field.max}`;
        break;
      case 'boolean':
        if (typeof val !== 'boolean') return `"${field.key}" must be true/false`;
        break;
      case 'select':
        if (typeof val !== 'string' || !field.options?.includes(val))
          return `"${field.key}" must be one of: ${field.options?.join(', ')}`;
        if (field.required && val === '') return `"${field.key}" is required`;
        break;
      case 'multiselect':
        if (!Array.isArray(val) || !val.every(v => typeof v === 'string' && field.options?.includes(v)))
          return `"${field.key}" must be an array of: ${field.options?.join(', ')}`;
        if (field.required && val.length === 0) return `"${field.key}" is required`;
        break;
    }
  }

  return null;
}

const router = createCrudRouter({
  table: 'supplies',
  searchColumns: ['name', 'description', 'material', 'brand'],
  filterColumns: ['reusable', 'material', 'profile_id'],
  sortColumns: ['name', 'created_at', 'updated_at', 'price', 'material', 'brand'],
  createSchema,
  updateSchema,
  expandConfig: {
    tags: {
      type: 'many',
      query: "SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'supply' AND et.entity_id = ?",
      key: 'id',
    },
  },
  beforeSave: (db, data, owner) => validateAttributesAgainstProfile(db, data, owner),
  beforeDelete: (db, id, ownerId) => {
    const craftsWithOnlyThis = db.prepare(`
      SELECT cs.craft_id
      FROM craft_supplies cs
      WHERE cs.supply_id = ?
        AND (SELECT COUNT(*) FROM craft_supplies WHERE craft_id = cs.craft_id) = 1
    `).all(id);

    if (craftsWithOnlyThis.length > 0) {
      return 'Cannot delete: this supply is the only one on a craft';
    }

    deletePhotosForEntity(db, ownerId, 'supply', id);
    deleteNotesForEntity(db, ownerId, 'supply', id);
    return null;
  },
});

export default router;
