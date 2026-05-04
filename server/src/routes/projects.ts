import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'complete', 'archived']).optional(),
  formula_id: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'complete', 'archived']).optional(),
});

const router = createCrudRouter({
  table: 'projects',
  searchColumns: ['title', 'description'],
  filterColumns: ['status', 'formula_id'],
  sortColumns: ['title', 'created_at', 'updated_at', 'status'],
  createSchema,
  updateSchema,
  expandConfig: {
    formula: {
      type: 'one',
      query: 'SELECT id, title FROM formulas WHERE id = ?',
      key: 'formula_id',
    },
    tags: {
      type: 'many',
      query: 'SELECT t.id, t.name FROM tags t JOIN project_tags pt ON t.id = pt.tag_id WHERE pt.project_id = ?',
      key: 'id',
    },
  },
});

export default router;
