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

  const crafts = db.prepare(
    'SELECT id, title, \'craft\' as type FROM crafts WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const techniques = db.prepare(
    'SELECT id, title, \'technique\' as type FROM techniques WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const projects = db.prepare(
    'SELECT id, title, \'project\' as type FROM projects WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const materials = db.prepare(
    'SELECT id, name as title, \'material\' as type FROM materials WHERE owner_id = ? AND name LIKE ? LIMIT 5'
  ).all(owner, pattern);

  const curiosities = db.prepare(
    'SELECT id, title, \'curiosity\' as type FROM curiosities WHERE owner_id = ? AND title LIKE ? LIMIT 5'
  ).all(owner, pattern);

  res.json({
    results: [...crafts, ...techniques, ...projects, ...materials, ...curiosities],
  });
});

export default router;
