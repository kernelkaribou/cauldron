import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { getDb } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { signToken } from '../auth/tokens.js';
import { authMiddleware } from '../auth/middleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts, please try again later' },
});

const setupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Check if setup is needed (public)
router.get('/setup-status', (_req: Request, res: Response) => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  res.json({ needsSetup: count.count === 0 });
});

// Create first admin user (public, self-locking)
router.post('/setup', validate(setupSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const { email, password, name } = req.body;

  // Atomic check — use transaction to prevent race conditions
  const createAdmin = db.transaction(() => {
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (count.count > 0) {
      return null;
    }

    const passwordHash = null; // placeholder, set after async hash
    return db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    );
  });

  // Check first (non-transactional quick check)
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count > 0) {
    res.status(403).json({ error: 'Setup already completed' });
    return;
  }

  const passwordHash = await hashPassword(password);

  // Transactional insert with recheck
  const insert = db.transaction(() => {
    const recheck = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (recheck.count > 0) return null;
    return db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, name, 'admin');
  });

  const result = insert();
  if (!result) {
    res.status(403).json({ error: 'Setup already completed' });
    return;
  }

  res.status(201).json({ message: 'Admin user created' });
});

// Login
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const { email, password } = req.body;

  const user = db.prepare('SELECT id, email, password_hash, name, role FROM users WHERE email = ?')
    .get(email) as { id: number; email: string; password_hash: string; name: string; role: string } | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  res.cookie('cauldron_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  res.json({ message: 'Logged in' });
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('cauldron_token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// Current user
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json(req.user);
});

export default router;
