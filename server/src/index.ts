import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './app.js';
import { runMigrations } from './migrate.js';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8090', 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

process.env.DATA_DIR = DATA_DIR;

// Initialize database and run migrations
getDb();
runMigrations();

// In production, serve the React SPA
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Cauldron server listening on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
