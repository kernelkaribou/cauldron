import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// --- Craft Techniques ---
router.get('/crafts/:id/techniques', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const items = db.prepare(`
    SELECT ft.id, ft.technique_id, ft.sort_order, ft.notes, t.title, t.content
    FROM craft_techniques ft JOIN techniques t ON ft.technique_id = t.id
    WHERE ft.craft_id = ? ORDER BY ft.sort_order
  `).all(req.params.id);
  res.json({ items });
});

const addTechniqueSchema = z.object({
  technique_id: z.number().int().positive(),
  sort_order: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

router.post('/crafts/:id/techniques', validate(addTechniqueSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const { technique_id, sort_order, notes } = req.body;
  try {
    db.prepare('INSERT INTO craft_techniques (craft_id, technique_id, sort_order, notes) VALUES (?, ?, ?, ?)')
      .run(req.params.id, technique_id, sort_order || 0, notes || null);
  } catch {
    res.status(409).json({ error: 'Technique already attached to this craft' });
    return;
  }
  res.status(201).json({ message: 'Technique added' });
});

router.delete('/crafts/:id/techniques/:techniqueId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const existing = db.prepare('SELECT 1 FROM craft_techniques WHERE craft_id = ? AND technique_id = ?')
    .get(req.params.id, req.params.techniqueId);
  if (!existing) { res.status(204).send(); return; }

  const { total } = db.prepare('SELECT COUNT(*) as total FROM craft_techniques WHERE craft_id = ?')
    .get(req.params.id) as { total: number };
  if (total <= 1) {
    res.status(400).json({ error: 'Cannot remove the last technique from a craft' });
    return;
  }

  db.prepare('DELETE FROM craft_techniques WHERE craft_id = ? AND technique_id = ?')
    .run(req.params.id, req.params.techniqueId);
  res.status(204).send();
});

// --- Craft Materials ---
router.get('/crafts/:id/materials', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const items = db.prepare(`
    SELECT fm.id, fm.material_id, fm.quantity, fm.unit, fm.notes, m.name
    FROM craft_materials fm JOIN materials m ON fm.material_id = m.id
    WHERE fm.craft_id = ? ORDER BY fm.id
  `).all(req.params.id);
  res.json({ items });
});

const addMaterialSchema = z.object({
  material_id: z.number().int().positive(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

router.post('/crafts/:id/materials', validate(addMaterialSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const { material_id, quantity, unit, notes } = req.body;
  try {
    db.prepare('INSERT INTO craft_materials (craft_id, material_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, material_id, quantity || 0, unit || null, notes || null);
  } catch {
    res.status(409).json({ error: 'Material already attached to this craft' });
    return;
  }
  res.status(201).json({ message: 'Material added' });
});

router.delete('/crafts/:id/materials/:materialId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const existing = db.prepare('SELECT 1 FROM craft_materials WHERE craft_id = ? AND material_id = ?')
    .get(req.params.id, req.params.materialId);
  if (!existing) { res.status(204).send(); return; }

  const { total } = db.prepare('SELECT COUNT(*) as total FROM craft_materials WHERE craft_id = ?')
    .get(req.params.id) as { total: number };
  if (total <= 1) {
    res.status(400).json({ error: 'Cannot remove the last material from a craft' });
    return;
  }

  db.prepare('DELETE FROM craft_materials WHERE craft_id = ? AND material_id = ?')
    .run(req.params.id, req.params.materialId);
  res.status(204).send();
});

// --- Project Techniques ---
router.get('/projects/:id/techniques', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const items = db.prepare(`
    SELECT pt.id, pt.technique_id, pt.sort_order, pt.notes, t.title, t.content
    FROM project_techniques pt JOIN techniques t ON pt.technique_id = t.id
    WHERE pt.project_id = ? ORDER BY pt.sort_order
  `).all(req.params.id);
  res.json({ items });
});

router.post('/projects/:id/techniques', validate(addTechniqueSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const { technique_id, sort_order, notes } = req.body;
  try {
    db.prepare('INSERT INTO project_techniques (project_id, technique_id, sort_order, notes) VALUES (?, ?, ?, ?)')
      .run(req.params.id, technique_id, sort_order || 0, notes || null);
  } catch {
    res.status(409).json({ error: 'Technique already attached to this project' });
    return;
  }
  res.status(201).json({ message: 'Technique added' });
});

router.delete('/projects/:id/techniques/:techniqueId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  db.prepare('DELETE FROM project_techniques WHERE project_id = ? AND technique_id = ?')
    .run(req.params.id, req.params.techniqueId);
  res.status(204).send();
});

// --- Project Materials ---
router.get('/projects/:id/materials', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const items = db.prepare(`
    SELECT pm.id, pm.material_id, pm.quantity, pm.unit, pm.notes, m.name
    FROM project_materials pm JOIN materials m ON pm.material_id = m.id
    WHERE pm.project_id = ? ORDER BY pm.id
  `).all(req.params.id);
  res.json({ items });
});

router.post('/projects/:id/materials', validate(addMaterialSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  const { material_id, quantity, unit, notes } = req.body;
  try {
    db.prepare('INSERT INTO project_materials (project_id, material_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, material_id, quantity || 0, unit || null, notes || null);
  } catch {
    res.status(409).json({ error: 'Material already attached to this project' });
    return;
  }
  res.status(201).json({ message: 'Material added' });
});

router.delete('/projects/:id/materials/:materialId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  db.prepare('DELETE FROM project_materials WHERE project_id = ? AND material_id = ?')
    .run(req.params.id, req.params.materialId);
  res.status(204).send();
});

// --- Technique Resources ---
router.get('/techniques/:id/resources', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const technique = db.prepare('SELECT id FROM techniques WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!technique) { res.status(404).json({ error: 'Technique not found' }); return; }

  const items = db.prepare('SELECT * FROM technique_resources WHERE technique_id = ?').all(req.params.id);
  res.json({ items });
});

const addResourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['video', 'article', 'other']).optional(),
});

router.post('/techniques/:id/resources', validate(addResourceSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const technique = db.prepare('SELECT id FROM techniques WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!technique) { res.status(404).json({ error: 'Technique not found' }); return; }

  const { url, title, description, type } = req.body;
  const result = db.prepare(
    'INSERT INTO technique_resources (technique_id, url, title, description, type) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, url, title, description || null, type || null);

  const resource = db.prepare('SELECT * FROM technique_resources WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(resource);
});

router.delete('/techniques/:id/resources/:resourceId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const technique = db.prepare('SELECT id FROM techniques WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!technique) { res.status(404).json({ error: 'Technique not found' }); return; }

  db.prepare('DELETE FROM technique_resources WHERE id = ? AND technique_id = ?')
    .run(req.params.resourceId, req.params.id);
  res.status(204).send();
});

// --- Material Stock ---
router.get('/materials/:id/stock', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const material = db.prepare('SELECT id FROM materials WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!material) { res.status(404).json({ error: 'Material not found' }); return; }

  const items = db.prepare('SELECT * FROM material_stock WHERE material_id = ? ORDER BY date DESC, created_at DESC')
    .all(req.params.id);
  res.json({ items });
});

router.get('/materials/:id/stock-summary', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const material = db.prepare('SELECT id FROM materials WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!material) { res.status(404).json({ error: 'Material not found' }); return; }

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
    FROM material_stock WHERE material_id = ?
  `).get(req.params.id);

  res.json(summary);
});

const addStockSchema = z.object({
  type: z.enum(['purchase', 'usage', 'adjustment']),
  quantity: z.number().positive(),
  unit_cost: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  project_id: z.number().int().positive().nullable().optional(),
  date: z.string().min(1),
});

router.post('/materials/:id/stock', validate(addStockSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const material = db.prepare('SELECT id FROM materials WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!material) { res.status(404).json({ error: 'Material not found' }); return; }

  const { type, quantity, unit_cost, location, notes, project_id, date } = req.body;
  const result = db.prepare(`
    INSERT INTO material_stock (material_id, type, quantity, unit_cost, location, notes, project_id, date, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, type, quantity, unit_cost || 0, location || null, notes || null, project_id || null, date, owner);

  const entry = db.prepare('SELECT * FROM material_stock WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// --- Shared Sub-Resources: Logs, Tasks, Journal Entries ---
router.get('/logs', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { craft_id, project_id } = req.query;

  let sql = 'SELECT * FROM logs WHERE owner_id = ?';
  const params: any[] = [owner];
  if (craft_id) { sql += ' AND craft_id = ?'; params.push(craft_id); }
  else if (project_id) { sql += ' AND project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY date DESC, created_at DESC';

  res.json({ items: db.prepare(sql).all(...params) });
});

const logSchema = z.object({
  content: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  date: z.string().min(1),
  craft_id: z.number().int().positive().nullable().optional(),
  project_id: z.number().int().positive().nullable().optional(),
});

router.post('/logs', validate(logSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { content, duration_minutes, date, craft_id, project_id } = req.body;

  const result = db.prepare(
    'INSERT INTO logs (owner_id, craft_id, project_id, content, duration_minutes, date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(owner, craft_id || null, project_id || null, content || null, duration_minutes || 0, date);

  res.status(201).json(db.prepare('SELECT * FROM logs WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/logs/:id', validate(logSchema.partial()), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const existing = db.prepare('SELECT id FROM logs WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const fields = Object.entries(req.body).filter(([_, v]) => v !== undefined);
  if (fields.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([_, v]) => v);
  db.prepare(`UPDATE logs SET ${setClauses} WHERE id = ?`).run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM logs WHERE id = ?').get(req.params.id));
});

router.delete('/logs/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const result = db.prepare('DELETE FROM logs WHERE id = ? AND owner_id = ?').run(req.params.id, owner);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).send();
});

router.get('/tasks', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { craft_id, project_id } = req.query;

  let sql = 'SELECT * FROM tasks WHERE owner_id = ?';
  const params: any[] = [owner];
  if (craft_id) { sql += ' AND craft_id = ?'; params.push(craft_id); }
  else if (project_id) { sql += ' AND project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY sort_order ASC, created_at ASC';

  res.json({ items: db.prepare(sql).all(...params) });
});

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
  done: z.number().int().min(0).max(1).optional(),
  due_date: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  craft_id: z.number().int().positive().nullable().optional(),
  project_id: z.number().int().positive().nullable().optional(),
});

router.post('/tasks', validate(taskSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { title, notes, done, due_date, sort_order, craft_id, project_id } = req.body;

  const result = db.prepare(
    'INSERT INTO tasks (owner_id, craft_id, project_id, title, notes, done, due_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(owner, craft_id || null, project_id || null, title, notes || null, done || 0, due_date || null, sort_order || 0);

  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/tasks/:id', validate(taskSchema.partial()), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const fields = Object.entries(req.body).filter(([_, v]) => v !== undefined);
  if (fields.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([_, v]) => v);
  db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`).run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

router.delete('/tasks/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND owner_id = ?').run(req.params.id, owner);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).send();
});

router.get('/journal-entries', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { craft_id, project_id } = req.query;

  let sql = 'SELECT * FROM journal_entries WHERE owner_id = ?';
  const params: any[] = [owner];
  if (craft_id) { sql += ' AND craft_id = ?'; params.push(craft_id); }
  else if (project_id) { sql += ' AND project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY created_at DESC';

  res.json({ items: db.prepare(sql).all(...params) });
});

const journalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  craft_id: z.number().int().positive().nullable().optional(),
  project_id: z.number().int().positive().nullable().optional(),
});

router.post('/journal-entries', validate(journalSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { title, content, craft_id, project_id } = req.body;

  const result = db.prepare(
    'INSERT INTO journal_entries (owner_id, craft_id, project_id, title, content) VALUES (?, ?, ?, ?, ?)'
  ).run(owner, craft_id || null, project_id || null, title, content || null);

  res.status(201).json(db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/journal-entries/:id', validate(journalSchema.partial()), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const existing = db.prepare('SELECT id FROM journal_entries WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const fields = Object.entries(req.body).filter(([_, v]) => v !== undefined);
  if (fields.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([_, v]) => v);
  db.prepare(`UPDATE journal_entries SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id));
});

router.delete('/journal-entries/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const result = db.prepare('DELETE FROM journal_entries WHERE id = ? AND owner_id = ?').run(req.params.id, owner);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).send();
});

const tagActionSchema = z.object({ tag_id: z.number().int().positive() });

function createTagRoutes(entityTable: string, junctionTable: string, fkColumn: string) {
  router.get(`/${entityTable}/:id/tags`, (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const entity = db.prepare(`SELECT id FROM ${entityTable} WHERE id = ? AND owner_id = ?`).get(req.params.id, owner);
    if (!entity) { res.status(404).json({ error: 'Not found' }); return; }

    const tags = db.prepare(`SELECT t.* FROM tags t JOIN ${junctionTable} jt ON t.id = jt.tag_id WHERE jt.${fkColumn} = ?`).all(req.params.id);
    res.json({ items: tags });
  });

  router.post(`/${entityTable}/:id/tags`, validate(tagActionSchema), (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const entity = db.prepare(`SELECT id FROM ${entityTable} WHERE id = ? AND owner_id = ?`).get(req.params.id, owner);
    if (!entity) { res.status(404).json({ error: 'Not found' }); return; }

    try {
      db.prepare(`INSERT INTO ${junctionTable} (${fkColumn}, tag_id) VALUES (?, ?)`).run(req.params.id, req.body.tag_id);
    } catch {
      res.status(409).json({ error: 'Tag already attached' });
      return;
    }
    res.status(201).json({ message: 'Tag added' });
  });

  router.delete(`/${entityTable}/:id/tags/:tagId`, (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const entity = db.prepare(`SELECT id FROM ${entityTable} WHERE id = ? AND owner_id = ?`).get(req.params.id, owner);
    if (!entity) { res.status(404).json({ error: 'Not found' }); return; }

    db.prepare(`DELETE FROM ${junctionTable} WHERE ${fkColumn} = ? AND tag_id = ?`).run(req.params.id, req.params.tagId);
    res.status(204).send();
  });
}

createTagRoutes('crafts', 'craft_tags', 'craft_id');
createTagRoutes('techniques', 'technique_tags', 'technique_id');
createTagRoutes('projects', 'project_tags', 'project_id');
createTagRoutes('materials', 'material_tags', 'material_id');
createTagRoutes('curiosities', 'curiosity_tags', 'curiosity_id');

router.post('/projects/from-craft', validate(z.object({
  craft_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
})), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { craft_id, title, description } = req.body;

  const craft = db.prepare('SELECT id FROM crafts WHERE id = ? AND owner_id = ?').get(craft_id, owner);
  if (!craft) { res.status(404).json({ error: 'Craft not found' }); return; }

  const createProject = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO projects (title, description, status, craft_id, owner_id) VALUES (?, ?, ?, ?, ?)'
    ).run(title, description || null, 'planning', craft_id, owner);

    const projectId = result.lastInsertRowid;

    const craftTechniques = db.prepare('SELECT technique_id, sort_order, notes FROM craft_techniques WHERE craft_id = ?').all(craft_id) as any[];
    for (const ft of craftTechniques) {
      db.prepare('INSERT INTO project_techniques (project_id, technique_id, sort_order, notes) VALUES (?, ?, ?, ?)')
        .run(projectId, ft.technique_id, ft.sort_order, ft.notes);
    }

    const craftMaterials = db.prepare('SELECT material_id, quantity, unit, notes FROM craft_materials WHERE craft_id = ?').all(craft_id) as any[];
    for (const fm of craftMaterials) {
      db.prepare('INSERT INTO project_materials (project_id, material_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)')
        .run(projectId, fm.material_id, fm.quantity, fm.unit, fm.notes);
    }

    return projectId;
  });

  const projectId = createProject();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.status(201).json(project);
});

export default router;
