import { z } from 'zod';
import { createCrudRouter } from './crud.js';
import { deleteNotesForEntity, deletePhotosForEntity } from './entity-utils.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  unit: z.string().max(50).optional(),
  reusable: z.number().int().min(0).max(1).optional(),
  price: z.number().min(0).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  unit: z.string().max(50).optional(),
  reusable: z.number().int().min(0).max(1).optional(),
  price: z.number().min(0).optional(),
});

const router = createCrudRouter({
  table: 'materials',
  searchColumns: ['name', 'description'],
  filterColumns: ['reusable'],
  sortColumns: ['name', 'created_at', 'updated_at', 'price'],
  createSchema,
  updateSchema,
  expandConfig: {
    tags: {
      type: 'many',
      query: "SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'material' AND et.entity_id = ?",
      key: 'id',
    },
  },
  beforeDelete: (db, id, ownerId) => {
    const craftsWithOnlyThis = db.prepare(`
      SELECT cm.craft_id
      FROM craft_materials cm
      WHERE cm.material_id = ?
        AND (SELECT COUNT(*) FROM craft_materials WHERE craft_id = cm.craft_id) = 1
    `).all(id);

    if (craftsWithOnlyThis.length > 0) {
      return 'Cannot delete: this material is the only one on a craft';
    }

    deletePhotosForEntity(db, ownerId, 'material', id);
    deleteNotesForEntity(db, ownerId, 'material', id);
    return null;
  },
});

export default router;
