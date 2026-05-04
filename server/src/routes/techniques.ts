import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  category_id: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  category_id: z.number().int().positive().nullable().optional(),
});

const router = createCrudRouter({
  table: 'techniques',
  searchColumns: ['title', 'content'],
  filterColumns: ['category_id'],
  sortColumns: ['title', 'created_at', 'updated_at'],
  createSchema,
  updateSchema,
  expandConfig: {
    category: {
      type: 'one',
      query: 'SELECT id, name FROM categories WHERE id = ?',
      key: 'category_id',
    },
    tags: {
      type: 'many',
      query: 'SELECT t.id, t.name FROM tags t JOIN technique_tags tt ON t.id = tt.tag_id WHERE tt.technique_id = ?',
      key: 'id',
    },
  },
  beforeDelete: (db, id) => {
    const craftsWithOnlyThis = db.prepare(`
      SELECT ct.craft_id
      FROM craft_techniques ct
      WHERE ct.technique_id = ?
        AND (SELECT COUNT(*) FROM craft_techniques WHERE craft_id = ct.craft_id) = 1
    `).all(id);

    if (craftsWithOnlyThis.length > 0) {
      return 'Cannot delete: this technique is the only one on a craft';
    }

    return null;
  },
});

export default router;
