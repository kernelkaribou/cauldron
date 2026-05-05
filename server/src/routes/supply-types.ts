import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const typeFieldSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, 'Key must be lowercase alphanumeric with underscores'),
  label: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'select', 'multiselect', 'boolean']),
  options: z.array(z.string().min(1).max(100)).optional(),
  required: z.boolean().optional(),
  unit: z.string().max(20).optional(),
  integer: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().max(100).optional(),
  show_in_list: z.boolean().optional(),
});

const typeSchemaValidator = z.array(typeFieldSchema).max(50);

function validateTypeSchema(schema: string): string | null {
  try {
    const parsed = JSON.parse(schema);
    const result = typeSchemaValidator.safeParse(parsed);
    if (!result.success) return result.error.errors[0].message;

    const keys = new Set<string>();
    for (const field of result.data) {
      if (keys.has(field.key)) return `Duplicate field key: ${field.key}`;
      keys.add(field.key);
      if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
        return `Field "${field.key}" of type ${field.type} requires options`;
      }
      if (field.type !== 'number' && (field.unit || field.integer || field.min !== undefined || field.max !== undefined)) {
        return `Field "${field.key}": unit/integer/min/max only apply to number fields`;
      }
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        return `Field "${field.key}": min cannot exceed max`;
      }
    }
    return null;
  } catch {
    return 'Invalid JSON';
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  schema: z.string().refine(
    (val) => validateTypeSchema(val) === null,
    (val) => ({ message: validateTypeSchema(val) || 'Invalid schema' })
  ),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  schema: z.string().refine(
    (val) => validateTypeSchema(val) === null,
    (val) => ({ message: validateTypeSchema(val) || 'Invalid schema' })
  ).optional(),
});

const router = createCrudRouter({
  table: 'supply_types',
  searchColumns: ['name'],
  filterColumns: [],
  sortColumns: ['name', 'created_at', 'updated_at'],
  createSchema,
  updateSchema,
  beforeDelete: (db, id, ownerId) => {
    const count = db.prepare(
      'SELECT COUNT(*) as cnt FROM supplies WHERE type_id = ? AND owner_id = ?'
    ).get(id, ownerId) as { cnt: number };
    if (count.cnt > 0) {
      return `Cannot delete: ${count.cnt} supply(ies) still use this type`;
    }
    return null;
  },
});

export default router;
