import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './auth/middleware.js';
import { errorHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import craftsRoutes from './routes/crafts.js';
import tagsRoutes from './routes/tags.js';
import spellsRoutes from './routes/spells.js';
import recipesRoutes from './routes/recipes.js';
import brewsRoutes from './routes/brews.js';
import ingredientsRoutes from './routes/ingredients.js';
import curiositiesRoutes from './routes/curiosities.js';
import photosRoutes from './routes/photos.js';

export const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (mixed public/protected)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/crafts', authMiddleware, craftsRoutes);
app.use('/api/tags', authMiddleware, tagsRoutes);
app.use('/api/spells', authMiddleware, spellsRoutes);
app.use('/api/recipes', authMiddleware, recipesRoutes);
app.use('/api/brews', authMiddleware, brewsRoutes);
app.use('/api/ingredients', authMiddleware, ingredientsRoutes);
app.use('/api/curiosities', authMiddleware, curiositiesRoutes);
app.use('/api/photos', authMiddleware, photosRoutes);

// Error handler
app.use(errorHandler);
