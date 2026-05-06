import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { assertOwned, deletePhotosForEntity } from './entity-utils.js';
import { registerStandardSubresourceRoutes } from './subresource-setup.js';
import { registerTagRoutes } from './tag-routes.js';

const router = Router();
const projectCraftSchema = z.object({
  craft_id: z.number().int().positive(),
  quantity: z.number().int().positive().optional(),
});
type AggregatedTagSource = 'craft' | 'technique' | 'supply';

registerStandardSubresourceRoutes(router);
registerTagRoutes(router);

router.delete('/logs/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const logId = Number(req.params.id);
  if (!assertOwned(db, 'logs', logId, owner)) { res.status(404).json({ error: 'Not found' }); return; }

  deletePhotosForEntity(db, owner, 'log', logId);
  db.prepare('DELETE FROM logs WHERE id = ? AND owner_id = ?').run(logId, owner);
  res.status(204).send();
});

router.get('/projects/:id/crafts', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  if (!assertOwned(db, 'projects', req.params.id as string, owner)) { res.status(404).json({ error: 'Project not found' }); return; }

  const items = db.prepare(`
    SELECT pc.id, pc.craft_id, pc.quantity, pc.sort_order, c.title
    FROM project_crafts pc
    JOIN crafts c ON c.id = pc.craft_id
    WHERE pc.project_id = ? AND c.owner_id = ?
    ORDER BY pc.sort_order, pc.id
  `).all(req.params.id, owner);
  res.json({ items });
});

router.post('/projects/:id/crafts', validate(projectCraftSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const projectId = Number(req.params.id);
  const { craft_id, quantity } = req.body;
  if (!assertOwned(db, 'projects', projectId, owner)) { res.status(404).json({ error: 'Project not found' }); return; }
  if (!assertOwned(db, 'crafts', craft_id, owner)) { res.status(404).json({ error: 'Craft not found' }); return; }

  const { nextSortOrder } = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as nextSortOrder FROM project_crafts WHERE project_id = ?'
  ).get(projectId) as { nextSortOrder: number };

  try {
    const result = db.prepare(
      'INSERT INTO project_crafts (project_id, craft_id, quantity, sort_order) VALUES (?, ?, ?, ?)'
    ).run(projectId, craft_id, quantity || 1, nextSortOrder);

    const item = db.prepare(`
      SELECT pc.id, pc.craft_id, pc.quantity, pc.sort_order, c.title
      FROM project_crafts pc
      JOIN crafts c ON c.id = pc.craft_id
      WHERE pc.id = ? AND c.owner_id = ?
    `).get(result.lastInsertRowid, owner);

    res.status(201).json(item);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Craft already attached to this project' });
      return;
    }
    throw error;
  }
});

router.delete('/projects/:id/crafts/:craftId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const projectId = Number(req.params.id);
  if (!assertOwned(db, 'projects', projectId, owner)) { res.status(404).json({ error: 'Project not found' }); return; }

  const existing = db.prepare('SELECT id FROM project_crafts WHERE project_id = ? AND craft_id = ?')
    .get(projectId, req.params.craftId);
  if (!existing) { res.status(204).send(); return; }

  db.prepare('DELETE FROM project_crafts WHERE project_id = ? AND craft_id = ?')
    .run(projectId, req.params.craftId);
  res.status(204).send();
});

router.get('/supplies/:id/stock-summary', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  if (!assertOwned(db, 'supplies', req.params.id as string, owner)) { res.status(404).json({ error: 'Supply not found' }); return; }

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'purchase' THEN quantity ELSE 0 END), 0) as total_purchased,
      COALESCE(SUM(CASE WHEN type = 'usage' THEN quantity ELSE 0 END), 0) as total_used,
      COALESCE(SUM(CASE WHEN type = 'adjustment' THEN quantity ELSE 0 END), 0) as total_adjusted,
      COALESCE(SUM(CASE
        WHEN type = 'purchase' THEN quantity
        WHEN type = 'usage' THEN -quantity
        ELSE quantity
      END), 0) as on_hand,
      COALESCE(SUM(CASE WHEN type = 'purchase' THEN quantity * unit_cost ELSE 0 END), 0) as total_spent,
      CASE WHEN SUM(CASE WHEN type = 'purchase' THEN quantity ELSE 0 END) > 0
        THEN SUM(CASE WHEN type = 'purchase' THEN quantity * unit_cost ELSE 0 END) / SUM(CASE WHEN type = 'purchase' THEN quantity ELSE 0 END)
        ELSE 0
      END as avg_unit_cost
    FROM supply_stock WHERE supply_id = ?
  `).get(req.params.id);
  res.json(summary);
});

router.get('/crafts/:id/all-tags', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craftId = Number(req.params.id);
  if (!assertOwned(db, 'crafts', craftId, owner)) { res.status(404).json({ error: 'Craft not found' }); return; }

  type TagRow = { id: number; name: string };
  type AggregatedTag = TagRow & { sources: Set<AggregatedTagSource> };

  const craftTags = db.prepare(
    "SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'craft' AND et.entity_id = ?"
  ).all(craftId) as TagRow[];
  const techniqueIds = (db.prepare('SELECT technique_id FROM craft_techniques WHERE craft_id = ?').all(craftId) as Array<{ technique_id: number }>)
    .map(({ technique_id }) => technique_id);
  const supplyIds = (db.prepare('SELECT supply_id FROM craft_supplies WHERE craft_id = ?').all(craftId) as Array<{ supply_id: number }>)
    .map(({ supply_id }) => supply_id);

  const loadEntityTags = (entityType: 'technique' | 'supply', entityIds: number[]): TagRow[] => {
    if (entityIds.length === 0) return [];
    const placeholders = entityIds.map(() => '?').join(', ');
    return db.prepare(
      `SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = ? AND et.entity_id IN (${placeholders})`
    ).all(entityType, ...entityIds) as TagRow[];
  };

  const aggregated = new Map<number, AggregatedTag>();
  const addTags = (tags: TagRow[], source: AggregatedTagSource) => {
    for (const tag of tags) {
      const existing = aggregated.get(tag.id);
      if (existing) existing.sources.add(source);
      else aggregated.set(tag.id, { ...tag, sources: new Set([source]) });
    }
  };

  addTags(craftTags, 'craft');
  addTags(loadEntityTags('technique', techniqueIds), 'technique');
  addTags(loadEntityTags('supply', supplyIds), 'supply');

  res.json({
    items: Array.from(aggregated.values()).map(({ sources, ...tag }) => ({ ...tag, sources: Array.from(sources) })),
  });
});

export default router;
