import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../auth/middleware.js';
import { hashPassword } from '../auth/passwords.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']),
});

// List users (admin only)
router.get('/users', requireAdmin, (_req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users').all();
  res.json({ items: users });
});

// Create user (admin only)
router.post('/users', requireAdmin, validate(createUserSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const { email, password, name, role } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already exists' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email, passwordHash, name, role || 'user');

  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(user);
});

// Update user role (admin only)
router.patch('/users/:id', requireAdmin, validate(updateUserSchema), (req: Request, res: Response) => {
  const db = getDb();
  const { role } = req.body;
  const userId = parseInt(req.params.id as string);

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, userId);
  const updated = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(userId);
  res.json(updated);
});

// Delete user (admin only, not self)
router.delete('/users/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const userId = parseInt(req.params.id as string);
  const owner = ownerId(req);

  if (userId === owner) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(204).send();
});

export default router;
