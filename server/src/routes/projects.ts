import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { assertOwned, deleteNotesForEntity, deletePhotosForEntity } from './entity-utils.js';

const router = Router();
const sortColumns = new Set(['title', 'created_at', 'updated_at', 'status', 'due_date']);
const nullableText = z.string().nullable().optional();
const projectStatusSchema = z.enum(['planning', 'active', 'complete', 'paused']);
const projectCraftSchema = z.object({
  id: z.number().int().positive(),
  quantity: z.number().int().positive().optional(),
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: nullableText,
  status: projectStatusSchema.optional(),
  due_date: nullableText,
  crafts: z.array(projectCraftSchema).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: nullableText,
  status: projectStatusSchema.optional(),
  due_date: nullableText,
  crafts: z.array(projectCraftSchema).optional(),
});

const fromCraftSchema = z.object({
  craft_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: nullableText,
  status: projectStatusSchema.optional(),
  due_date: nullableText,
});

const fromCuriositySchema = z.object({
  curiosity_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: nullableText,
});

type ProjectCraftInput = z.infer<typeof projectCraftSchema>;
type CreateProjectInput = z.infer<typeof createSchema>;
type UpdateProjectInput = z.infer<typeof updateSchema>;
type SnapshotTechniqueRow = { technique_id: number; sort_order: number | null; notes: string | null };
type SnapshotSupplyRow = { supply_id: number; quantity: number | null; unit: string | null; notes: string | null };

class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function parseExpand(req: Request): Set<string> {
  const expand = req.query.expand as string | undefined;
  if (!expand) return new Set();
  return new Set(expand.split(',').map(part => part.trim()).filter(Boolean));
}

function joinNotes(notes: Array<string | null | undefined>): string | null {
  const uniqueNotes = Array.from(new Set(
    notes
      .map(note => note?.trim())
      .filter((note): note is string => Boolean(note))
  ));

  return uniqueNotes.length > 0 ? uniqueNotes.join('\n\n') : null;
}

function ensureOwnedCrafts(owner: number, crafts: ProjectCraftInput[]): number[] {
  const craftIds = crafts.map(craft => craft.id);
  if (new Set(craftIds).size !== craftIds.length) {
    throw new RequestError(400, 'Duplicate crafts are not allowed');
  }

  const db = getDb();
  const placeholders = craftIds.map(() => '?').join(', ');
  const rows = db.prepare(`SELECT id FROM crafts WHERE owner_id = ? AND id IN (${placeholders})`)
    .all(owner, ...craftIds) as Array<{ id: number }>;

  if (rows.length !== craftIds.length) {
    throw new RequestError(400, 'One or more crafts were not found');
  }

  return craftIds;
}

function insertProjectCrafts(projectId: number, crafts: ProjectCraftInput[]): void {
  const db = getDb();
  const insertProjectCraft = db.prepare(
    'INSERT INTO project_crafts (project_id, craft_id, quantity, sort_order) VALUES (?, ?, ?, ?)'
  );

  crafts.forEach((craft, index) => {
    insertProjectCraft.run(projectId, craft.id, craft.quantity ?? 1, index);
  });
}

function snapshotProjectTechniques(projectId: number, craftIds: number[]): void {
  const db = getDb();
  const placeholders = craftIds.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT ct.technique_id, ct.sort_order, ct.notes
    FROM craft_techniques ct
    WHERE ct.craft_id IN (${placeholders})
    ORDER BY ct.craft_id, ct.id
  `).all(...craftIds) as SnapshotTechniqueRow[];

  const aggregated = new Map<number, { sort_order: number; notes: Array<string | null> }>();

  for (const row of rows) {
    const existing = aggregated.get(row.technique_id);
    if (existing) {
      existing.sort_order = Math.max(existing.sort_order, row.sort_order ?? 0);
      existing.notes.push(row.notes);
      continue;
    }

    aggregated.set(row.technique_id, {
      sort_order: row.sort_order ?? 0,
      notes: [row.notes],
    });
  }

  const insertTechnique = db.prepare(
    'INSERT INTO project_techniques (project_id, technique_id, sort_order, notes) VALUES (?, ?, ?, ?)'
  );

  for (const [techniqueId, value] of aggregated) {
    insertTechnique.run(projectId, techniqueId, value.sort_order, joinNotes(value.notes));
  }
}

function snapshotProjectSupplies(projectId: number, craftIds: number[]): void {
  const db = getDb();
  const placeholders = craftIds.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT cs.supply_id, cs.quantity, cs.unit, cs.notes
    FROM craft_supplies cs
    WHERE cs.craft_id IN (${placeholders})
    ORDER BY cs.craft_id, cs.id
  `).all(...craftIds) as SnapshotSupplyRow[];

  const aggregated = new Map<number, { quantity: number; unit: string | null; notes: Array<string | null> }>();

  for (const row of rows) {
    const existing = aggregated.get(row.supply_id);
    if (existing) {
      existing.quantity += row.quantity ?? 0;
      if (!existing.unit && row.unit) {
        existing.unit = row.unit;
      }
      existing.notes.push(row.notes);
      continue;
    }

    aggregated.set(row.supply_id, {
      quantity: row.quantity ?? 0,
      unit: row.unit,
      notes: [row.notes],
    });
  }

  const insertSupply = db.prepare(
    'INSERT INTO project_supplies (project_id, supply_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)'
  );

  for (const [supplyId, value] of aggregated) {
    insertSupply.run(projectId, supplyId, value.quantity, value.unit, joinNotes(value.notes));
  }
}

function createProject(owner: number, data: CreateProjectInput): number {
  const db = getDb();

  return db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO projects (title, description, status, due_date, owner_id) VALUES (?, ?, ?, ?, ?)'
    ).run(data.title, data.description ?? null, data.status ?? 'planning', data.due_date ?? null, owner);

    const projectId = Number(result.lastInsertRowid);

    if (data.crafts && data.crafts.length > 0) {
      const craftIds = ensureOwnedCrafts(owner, data.crafts);
      insertProjectCrafts(projectId, data.crafts);
      snapshotProjectTechniques(projectId, craftIds);
      snapshotProjectSupplies(projectId, craftIds);
    }

    return projectId;
  })();
}

function buildListQuery(req: Request): { sql: string; countSql: string; params: any[]; page: number; perPage: number } {
  const owner = ownerId(req);
  const conditions: string[] = ['projects.owner_id = ?'];
  const params: any[] = [owner];

  if (req.query.status !== undefined) {
    conditions.push('projects.status = ?');
    params.push(req.query.status);
  }

  const search = req.query.search as string | undefined;
  if (search) {
    conditions.push('(projects.title LIKE ? OR projects.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (req.query.tag_id) {
    conditions.push("projects.id IN (SELECT entity_id FROM entity_tags WHERE entity_type = 'project' AND tag_id = ?)");
    params.push(req.query.tag_id);
  }

  let orderBy = 'projects.created_at DESC';
  const sortParam = req.query.sort as string | undefined;
  const requestedOrder = typeof req.query.order === 'string' ? req.query.order.toUpperCase() : undefined;
  if (sortParam) {
    let direction = 'ASC';
    let column = sortParam;
    if (sortParam.startsWith('-')) {
      direction = 'DESC';
      column = sortParam.slice(1);
    }
    if (requestedOrder === 'ASC' || requestedOrder === 'DESC') {
      direction = requestedOrder;
    }
    if (sortColumns.has(column)) {
      orderBy = `projects.${column} ${direction}`;
    }
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page as string) || 24));
  const where = `WHERE ${conditions.join(' AND ')}`;

  return {
    sql: `SELECT projects.* FROM projects ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    countSql: `SELECT COUNT(*) as total FROM projects ${where}`,
    params,
    page,
    perPage,
  };
}

function applyProjectExpansions(items: any[], requested: Set<string>, owner: number): void {
  if (items.length === 0 || requested.size === 0) return;

  const db = getDb();
  const craftsStmt = db.prepare(`
    SELECT pc.id, pc.craft_id, pc.quantity, pc.sort_order, c.title, c.description, c.category_id, c.thumbnail, c.duration_minutes
    FROM project_crafts pc
    JOIN crafts c ON c.id = pc.craft_id
    WHERE pc.project_id = ? AND c.owner_id = ?
    ORDER BY pc.sort_order, pc.id
  `);
  const tagsStmt = db.prepare(
    "SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'project' AND et.entity_id = ?"
  );
  const techniquesStmt = db.prepare(`
    SELECT pt.id, pt.technique_id, pt.sort_order, pt.notes, t.title, t.content, t.category_id, t.difficulty
    FROM project_techniques pt
    JOIN techniques t ON t.id = pt.technique_id
    WHERE pt.project_id = ?
    ORDER BY pt.sort_order, pt.id
  `);
  const suppliesStmt = db.prepare(`
    SELECT ps.id, pm.supply_id, ps.quantity, ps.unit, ps.notes, s.name, s.description, s.unit AS default_unit, s.reusable, s.price
    FROM project_supplies pm
    JOIN supplies s ON m.id = pm.supply_id
    WHERE pm.project_id = ?
    ORDER BY ps.id
  `);

  for (const item of items) {
    if (requested.has('crafts')) {
      item.crafts = craftsStmt.all(item.id, owner);
    }
    if (requested.has('tags')) {
      item.tags = tagsStmt.all(item.id);
    }
    if (requested.has('techniques')) {
      item.techniques = techniquesStmt.all(item.id);
    }
    if (requested.has('supplies')) {
      item.supplies = suppliesStmt.all(item.id);
    }
  }
}

function handleRouteError(res: Response, error: unknown): void {
  if (error instanceof RequestError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json({ error: 'Invalid foreign key reference' });
    return;
  }

  if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({ error: 'Craft already attached to this project' });
    return;
  }

  throw error;
}

function enrichProjectCovers(db: ReturnType<typeof getDb>, items: any[], owner: number): void {
  if (items.length === 0) return;
  const ids = items.map(i => i.id);
  const placeholders = ids.map(() => '?').join(',');
  const covers = db.prepare(
    `SELECT id, entity_id FROM photos WHERE owner_id = ? AND entity_type = 'project' AND entity_id IN (${placeholders}) AND is_cover = 1`
  ).all(owner, ...ids) as Array<{ id: number; entity_id: number }>;
  const coverMap = new Map(covers.map(c => [c.entity_id, c.id]));
  for (const item of items) {
    item.cover_photo_id = coverMap.get(item.id) ?? null;
  }
}

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const owner = ownerId(req);
  const data = req.body as CreateProjectInput;

  try {
    const projectId = createProject(owner, data);
    const project = getDb().prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(projectId, owner);
    res.status(201).json(project);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/from-craft', validate(fromCraftSchema), (req: Request, res: Response) => {
  const owner = ownerId(req);
  const { craft_id, title, description, status, due_date } = req.body as z.infer<typeof fromCraftSchema>;

  try {
    const projectId = createProject(owner, {
      title,
      description,
      status,
      due_date,
      crafts: [{ id: craft_id, quantity: 1 }],
    });
    const project = getDb().prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(projectId, owner);
    res.status(201).json(project);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/from-curiosity', validate(fromCuriositySchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { curiosity_id, title, description } = req.body as z.infer<typeof fromCuriositySchema>;

  const curiosity = db.prepare('SELECT * FROM curiosities WHERE id = ? AND owner_id = ?').get(curiosity_id, owner) as any;
  if (!curiosity) {
    res.status(404).json({ error: 'Curiosity not found' });
    return;
  }

  try {
    const projectDescription = description ?? curiosity.description ?? null;
    const projectId = createProject(owner, {
      title,
      description: projectDescription,
    });

    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(projectId, owner);
    res.status(201).json(project);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { sql, countSql, params, page, perPage } = buildListQuery(req);
  const items = db.prepare(sql).all(...params, perPage, (page - 1) * perPage) as any[];
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  applyProjectExpansions(items, parseExpand(req), owner);
  enrichProjectCovers(db, items, owner);

  res.json({
    items,
    page,
    per_page: perPage,
    total_items: total,
    total_pages: Math.ceil(total / perPage),
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner) as any;

  if (!project) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  applyProjectExpansions([project], parseExpand(req), owner);
  enrichProjectCovers(db, [project], owner);
  res.json(project);
});

router.put('/:id', validate(updateSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const projectId = Number(req.params.id);

  if (!assertOwned(db, 'projects', projectId, owner)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const data = req.body as UpdateProjectInput;
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  try {
    const updatedProject = db.transaction(() => {
      const updates: Record<string, unknown> = {};
      if ('title' in data) updates.title = data.title;
      if ('description' in data) updates.description = data.description ?? null;
      if ('status' in data) updates.status = data.status;
      if ('due_date' in data) updates.due_date = data.due_date ?? null;

      const timestamp = new Date().toISOString();
      const updateEntries = Object.entries({ ...updates, updated_at: timestamp }).filter(([, value]) => value !== undefined);
      const setClause = updateEntries.map(([column]) => `${column} = ?`).join(', ');
      const values = updateEntries.map(([, value]) => value);
      db.prepare(`UPDATE projects SET ${setClause} WHERE id = ? AND owner_id = ?`).run(...values, projectId, owner);

      if (data.crafts) {
        ensureOwnedCrafts(owner, data.crafts);
        db.prepare('DELETE FROM project_crafts WHERE project_id = ?').run(projectId);
        insertProjectCrafts(projectId, data.crafts);
      }

      return db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(projectId, owner);
    })();

    res.json(updatedProject);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const projectId = Number(req.params.id);

  if (!assertOwned(db, 'projects', projectId, owner)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const logs = db.prepare('SELECT id FROM logs WHERE owner_id = ? AND project_id = ?').all(owner, projectId) as Array<{ id: number }>;
  for (const log of logs) {
    deletePhotosForEntity(db, owner, 'log', log.id);
  }

  deletePhotosForEntity(db, owner, 'project', projectId);
  deleteNotesForEntity(db, owner, 'project', projectId);
  db.prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?').run(projectId, owner);

  res.status(204).send();
});

export default router;
