import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { assertOwned } from './entity-utils.js';

const tagActionSchema = z.object({ tag_id: z.number().int().positive() });
const taggableEntityTypeSchema = z.enum(['crafts', 'techniques', 'projects', 'supplies', 'curiosities']);
type TaggableEntityType = z.infer<typeof taggableEntityTypeSchema>;

const tagEntityConfig: Record<TaggableEntityType, {
  table: string;
  entityType: 'craft' | 'technique' | 'project' | 'supply' | 'curiosity';
  notFound: string;
}> = {
  crafts: { table: 'crafts', entityType: 'craft', notFound: 'Craft not found' },
  techniques: { table: 'techniques', entityType: 'technique', notFound: 'Technique not found' },
  projects: { table: 'projects', entityType: 'project', notFound: 'Project not found' },
  supplies: { table: 'supplies', entityType: 'supply', notFound: 'Supply not found' },
  curiosities: { table: 'curiosities', entityType: 'curiosity', notFound: 'Curiosity not found' },
};

function getTagEntityContext(req: Request, res: Response) {
  const parsedEntityType = taggableEntityTypeSchema.safeParse(req.params.entityType);
  if (!parsedEntityType.success) { res.status(400).json({ error: 'Invalid entity type' }); return null; }

  const db = getDb();
  const owner = ownerId(req);
  const config = tagEntityConfig[parsedEntityType.data];
  if (!assertOwned(db, config.table, req.params.id as string, owner)) { res.status(404).json({ error: config.notFound }); return null; }
  return { db, config };
}

export function registerTagRoutes(router: Router): void {
  router.get('/:entityType/:id/tags', (req: Request, res: Response) => {
    const context = getTagEntityContext(req, res);
    if (!context) return;

    const tags = context.db.prepare(
      'SELECT t.* FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = ? AND et.entity_id = ?'
    ).all(context.config.entityType, req.params.id);
    res.json({ items: tags });
  });

  router.post('/:entityType/:id/tags', validate(tagActionSchema), (req: Request, res: Response) => {
    const context = getTagEntityContext(req, res);
    if (!context) return;

    try {
      context.db.prepare('INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?, ?, ?)')
        .run(context.config.entityType, req.params.id, req.body.tag_id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
        res.status(400).json({ error: 'Tag not found' });
        return;
      }
      res.status(409).json({ error: 'Tag already attached' });
      return;
    }

    res.status(201).json({ message: 'Tag added' });
  });

  router.delete('/:entityType/:id/tags/:tagId', (req: Request, res: Response) => {
    const context = getTagEntityContext(req, res);
    if (!context) return;

    context.db.prepare('DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ? AND tag_id = ?')
      .run(context.config.entityType, req.params.id, req.params.tagId);
    res.status(204).send();
  });
}
