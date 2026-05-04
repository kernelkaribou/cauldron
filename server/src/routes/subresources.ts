import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// --- Recipe Spells ---
router.get('/recipes/:id/spells', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  const items = db.prepare(`
    SELECT rs.id, rs.spell_id, rs.sort_order, rs.notes, s.title, s.content
    FROM recipe_spells rs JOIN spells s ON rs.spell_id = s.id
    WHERE rs.recipe_id = ? ORDER BY rs.sort_order
  `).all(req.params.id);
  res.json({ items });
});

const addSpellSchema = z.object({
  spell_id: z.number().int().positive(),
  sort_order: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

router.post('/recipes/:id/spells', validate(addSpellSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  const { spell_id, sort_order, notes } = req.body;
  try {
    db.prepare('INSERT INTO recipe_spells (recipe_id, spell_id, sort_order, notes) VALUES (?, ?, ?, ?)')
      .run(req.params.id, spell_id, sort_order || 0, notes || null);
  } catch {
    res.status(409).json({ error: 'Spell already attached to this recipe' });
    return;
  }
  res.status(201).json({ message: 'Spell added' });
});

router.delete('/recipes/:id/spells/:spellId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  db.prepare('DELETE FROM recipe_spells WHERE recipe_id = ? AND spell_id = ?')
    .run(req.params.id, req.params.spellId);
  res.status(204).send();
});

// --- Recipe Ingredients ---
router.get('/recipes/:id/ingredients', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  const items = db.prepare(`
    SELECT ri.id, ri.ingredient_id, ri.quantity, ri.unit, ri.notes, i.name
    FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.recipe_id = ? ORDER BY ri.id
  `).all(req.params.id);
  res.json({ items });
});

const addIngredientSchema = z.object({
  ingredient_id: z.number().int().positive(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

router.post('/recipes/:id/ingredients', validate(addIngredientSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  const { ingredient_id, quantity, unit, notes } = req.body;
  try {
    db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, ingredient_id, quantity || 0, unit || null, notes || null);
  } catch {
    res.status(409).json({ error: 'Ingredient already attached to this recipe' });
    return;
  }
  res.status(201).json({ message: 'Ingredient added' });
});

router.delete('/recipes/:id/ingredients/:ingredientId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ? AND ingredient_id = ?')
    .run(req.params.id, req.params.ingredientId);
  res.status(204).send();
});

// --- Brew Spells ---
router.get('/brews/:id/spells', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const brew = db.prepare('SELECT id FROM brews WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!brew) { res.status(404).json({ error: 'Brew not found' }); return; }

  const items = db.prepare(`
    SELECT bs.id, bs.spell_id, bs.sort_order, bs.notes, s.title, s.content
    FROM brew_spells bs JOIN spells s ON bs.spell_id = s.id
    WHERE bs.brew_id = ? ORDER BY bs.sort_order
  `).all(req.params.id);
  res.json({ items });
});

router.post('/brews/:id/spells', validate(addSpellSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const brew = db.prepare('SELECT id FROM brews WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!brew) { res.status(404).json({ error: 'Brew not found' }); return; }

  const { spell_id, sort_order, notes } = req.body;
  try {
    db.prepare('INSERT INTO brew_spells (brew_id, spell_id, sort_order, notes) VALUES (?, ?, ?, ?)')
      .run(req.params.id, spell_id, sort_order || 0, notes || null);
  } catch {
    res.status(409).json({ error: 'Spell already attached to this brew' });
    return;
  }
  res.status(201).json({ message: 'Spell added' });
});

router.delete('/brews/:id/spells/:spellId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const brew = db.prepare('SELECT id FROM brews WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!brew) { res.status(404).json({ error: 'Brew not found' }); return; }

  db.prepare('DELETE FROM brew_spells WHERE brew_id = ? AND spell_id = ?')
    .run(req.params.id, req.params.spellId);
  res.status(204).send();
});

// --- Brew Ingredients ---
router.get('/brews/:id/ingredients', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const brew = db.prepare('SELECT id FROM brews WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!brew) { res.status(404).json({ error: 'Brew not found' }); return; }

  const items = db.prepare(`
    SELECT bi.id, bi.ingredient_id, bi.quantity, bi.unit, bi.notes, i.name
    FROM brew_ingredients bi JOIN ingredients i ON bi.ingredient_id = i.id
    WHERE bi.brew_id = ? ORDER BY bi.id
  `).all(req.params.id);
  res.json({ items });
});

router.post('/brews/:id/ingredients', validate(addIngredientSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const brew = db.prepare('SELECT id FROM brews WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!brew) { res.status(404).json({ error: 'Brew not found' }); return; }

  const { ingredient_id, quantity, unit, notes } = req.body;
  try {
    db.prepare('INSERT INTO brew_ingredients (brew_id, ingredient_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, ingredient_id, quantity || 0, unit || null, notes || null);
  } catch {
    res.status(409).json({ error: 'Ingredient already attached to this brew' });
    return;
  }
  res.status(201).json({ message: 'Ingredient added' });
});

router.delete('/brews/:id/ingredients/:ingredientId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const brew = db.prepare('SELECT id FROM brews WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!brew) { res.status(404).json({ error: 'Brew not found' }); return; }

  db.prepare('DELETE FROM brew_ingredients WHERE brew_id = ? AND ingredient_id = ?')
    .run(req.params.id, req.params.ingredientId);
  res.status(204).send();
});

// --- Spell Resources ---
router.get('/spells/:id/resources', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const spell = db.prepare('SELECT id FROM spells WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!spell) { res.status(404).json({ error: 'Spell not found' }); return; }

  const items = db.prepare('SELECT * FROM spell_resources WHERE spell_id = ?').all(req.params.id);
  res.json({ items });
});

const addResourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['video', 'article', 'other']).optional(),
});

router.post('/spells/:id/resources', validate(addResourceSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const spell = db.prepare('SELECT id FROM spells WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!spell) { res.status(404).json({ error: 'Spell not found' }); return; }

  const { url, title, description, type } = req.body;
  const result = db.prepare(
    'INSERT INTO spell_resources (spell_id, url, title, description, type) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, url, title, description || null, type || null);

  const resource = db.prepare('SELECT * FROM spell_resources WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(resource);
});

router.delete('/spells/:id/resources/:resourceId', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const spell = db.prepare('SELECT id FROM spells WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!spell) { res.status(404).json({ error: 'Spell not found' }); return; }

  db.prepare('DELETE FROM spell_resources WHERE id = ? AND spell_id = ?')
    .run(req.params.resourceId, req.params.id);
  res.status(204).send();
});

// --- Ingredient Stock ---
router.get('/ingredients/:id/stock', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const ingredient = db.prepare('SELECT id FROM ingredients WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!ingredient) { res.status(404).json({ error: 'Ingredient not found' }); return; }

  const items = db.prepare('SELECT * FROM ingredient_stock WHERE ingredient_id = ? ORDER BY date DESC, created_at DESC')
    .all(req.params.id);
  res.json({ items });
});

router.get('/ingredients/:id/stock-summary', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const ingredient = db.prepare('SELECT id FROM ingredients WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!ingredient) { res.status(404).json({ error: 'Ingredient not found' }); return; }

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
    FROM ingredient_stock WHERE ingredient_id = ?
  `).get(req.params.id);

  res.json(summary);
});

const addStockSchema = z.object({
  type: z.enum(['purchase', 'usage', 'adjustment']),
  quantity: z.number().positive(),
  unit_cost: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  brew_id: z.number().int().positive().nullable().optional(),
  date: z.string().min(1),
});

router.post('/ingredients/:id/stock', validate(addStockSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const ingredient = db.prepare('SELECT id FROM ingredients WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
  if (!ingredient) { res.status(404).json({ error: 'Ingredient not found' }); return; }

  const { type, quantity, unit_cost, location, notes, brew_id, date } = req.body;
  const result = db.prepare(`
    INSERT INTO ingredient_stock (ingredient_id, type, quantity, unit_cost, location, notes, brew_id, date, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, type, quantity, unit_cost || 0, location || null, notes || null, brew_id || null, date, owner);

  const entry = db.prepare('SELECT * FROM ingredient_stock WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// --- Shared Sub-Resources: Logs, Tasks, Journal Entries ---
// Logs
router.get('/logs', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { recipe_id, brew_id } = req.query;

  let sql = 'SELECT * FROM logs WHERE owner_id = ?';
  const params: any[] = [owner];
  if (recipe_id) { sql += ' AND recipe_id = ?'; params.push(recipe_id); }
  else if (brew_id) { sql += ' AND brew_id = ?'; params.push(brew_id); }
  sql += ' ORDER BY date DESC, created_at DESC';

  res.json({ items: db.prepare(sql).all(...params) });
});

const logSchema = z.object({
  content: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  date: z.string().min(1),
  recipe_id: z.number().int().positive().nullable().optional(),
  brew_id: z.number().int().positive().nullable().optional(),
});

router.post('/logs', validate(logSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { content, duration_minutes, date, recipe_id, brew_id } = req.body;

  const result = db.prepare(
    'INSERT INTO logs (owner_id, recipe_id, brew_id, content, duration_minutes, date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(owner, recipe_id || null, brew_id || null, content || null, duration_minutes || 0, date);

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

// Tasks
router.get('/tasks', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { recipe_id, brew_id } = req.query;

  let sql = 'SELECT * FROM tasks WHERE owner_id = ?';
  const params: any[] = [owner];
  if (recipe_id) { sql += ' AND recipe_id = ?'; params.push(recipe_id); }
  else if (brew_id) { sql += ' AND brew_id = ?'; params.push(brew_id); }
  sql += ' ORDER BY sort_order ASC, created_at ASC';

  res.json({ items: db.prepare(sql).all(...params) });
});

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
  done: z.number().int().min(0).max(1).optional(),
  due_date: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  recipe_id: z.number().int().positive().nullable().optional(),
  brew_id: z.number().int().positive().nullable().optional(),
});

router.post('/tasks', validate(taskSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { title, notes, done, due_date, sort_order, recipe_id, brew_id } = req.body;

  const result = db.prepare(
    'INSERT INTO tasks (owner_id, recipe_id, brew_id, title, notes, done, due_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(owner, recipe_id || null, brew_id || null, title, notes || null, done || 0, due_date || null, sort_order || 0);

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

// Journal Entries
router.get('/journal-entries', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { recipe_id, brew_id } = req.query;

  let sql = 'SELECT * FROM journal_entries WHERE owner_id = ?';
  const params: any[] = [owner];
  if (recipe_id) { sql += ' AND recipe_id = ?'; params.push(recipe_id); }
  else if (brew_id) { sql += ' AND brew_id = ?'; params.push(brew_id); }
  sql += ' ORDER BY created_at DESC';

  res.json({ items: db.prepare(sql).all(...params) });
});

const journalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  recipe_id: z.number().int().positive().nullable().optional(),
  brew_id: z.number().int().positive().nullable().optional(),
});

router.post('/journal-entries', validate(journalSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { title, content, recipe_id, brew_id } = req.body;

  const result = db.prepare(
    'INSERT INTO journal_entries (owner_id, recipe_id, brew_id, title, content) VALUES (?, ?, ?, ?, ?)'
  ).run(owner, recipe_id || null, brew_id || null, title, content || null);

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

// --- Tag Management (add/remove tags to entities) ---
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

createTagRoutes('recipes', 'recipe_tags', 'recipe_id');
createTagRoutes('spells', 'spell_tags', 'spell_id');
createTagRoutes('brews', 'brew_tags', 'brew_id');
createTagRoutes('ingredients', 'ingredient_tags', 'ingredient_id');
createTagRoutes('curiosities', 'curiosity_tags', 'curiosity_id');

// --- Brew from Recipe ---
router.post('/brews/from-recipe', validate(z.object({
  recipe_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
})), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { recipe_id, title, description } = req.body;

  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ? AND owner_id = ?').get(recipe_id, owner);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }

  const createBrew = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO brews (title, description, status, recipe_id, owner_id) VALUES (?, ?, ?, ?, ?)'
    ).run(title, description || null, 'gathering', recipe_id, owner);

    const brewId = result.lastInsertRowid;

    // Copy spells from recipe
    const recipeSpells = db.prepare('SELECT spell_id, sort_order, notes FROM recipe_spells WHERE recipe_id = ?').all(recipe_id) as any[];
    for (const rs of recipeSpells) {
      db.prepare('INSERT INTO brew_spells (brew_id, spell_id, sort_order, notes) VALUES (?, ?, ?, ?)')
        .run(brewId, rs.spell_id, rs.sort_order, rs.notes);
    }

    // Copy ingredients from recipe
    const recipeIngredients = db.prepare('SELECT ingredient_id, quantity, unit, notes FROM recipe_ingredients WHERE recipe_id = ?').all(recipe_id) as any[];
    for (const ri of recipeIngredients) {
      db.prepare('INSERT INTO brew_ingredients (brew_id, ingredient_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)')
        .run(brewId, ri.ingredient_id, ri.quantity, ri.unit, ri.notes);
    }

    return brewId;
  });

  const brewId = createBrew();
  const brew = db.prepare('SELECT * FROM brews WHERE id = ?').get(brewId);
  res.status(201).json(brew);
});

export default router;
