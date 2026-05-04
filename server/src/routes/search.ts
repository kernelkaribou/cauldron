import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const q = (req.query.q as string || '').trim();

  if (!q || q.length < 2) {
    res.json({ results: [] });
    return;
  }

  const pattern = `%${q}%`;

  const recipes = db.prepare(
    'SELECT id, title, \'recipe\' as type FROM recipes WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const spells = db.prepare(
    'SELECT id, title, \'spell\' as type FROM spells WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const brews = db.prepare(
    'SELECT id, title, \'brew\' as type FROM brews WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const ingredients = db.prepare(
    'SELECT id, name as title, \'ingredient\' as type FROM ingredients WHERE owner_id = ? AND name LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const curiosities = db.prepare(
    'SELECT id, title, \'curiosity\' as type FROM curiosities WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  res.json({
    results: [...recipes, ...spells, ...brews, ...ingredients, ...curiosities],
  });
});

export default router;
