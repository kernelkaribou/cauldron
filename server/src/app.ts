import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { authMiddleware, requireAdmin } from './auth/middleware.js';
import { errorHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import craftsRoutes from './routes/crafts.js';
import tagsRoutes from './routes/tags.js';
import techniquesRoutes from './routes/techniques.js';
import projectsRoutes from './routes/projects.js';
import suppliesRoutes from './routes/supplies.js';
import supplyProfilesRoutes from './routes/supply-profiles.js';
import curiositiesRoutes from './routes/curiosities.js';
import photosRoutes from './routes/photos.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import subresourcesRoutes from './routes/subresources.js';

export const app = express();

// Only trust proxy headers when explicitly configured (user is behind nginx/Traefik/Authelia)
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
}

app.use(helmet({
  contentSecurityPolicy: false, // SPA handles its own CSP needs
  crossOriginEmbedderPolicy: false, // allow loading images
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use('/api/categories', authMiddleware, categoriesRoutes);
app.use('/api/crafts', authMiddleware, craftsRoutes);
app.use('/api/tags', authMiddleware, tagsRoutes);
app.use('/api/techniques', authMiddleware, techniquesRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);
app.use('/api/supplies', authMiddleware, suppliesRoutes);
app.use('/api/supply-profiles', authMiddleware, supplyProfilesRoutes);
app.use('/api/curiosities', authMiddleware, curiositiesRoutes);
app.use('/api/photos', authMiddleware, photosRoutes);
app.use('/api/search', authMiddleware, searchRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api', authMiddleware, subresourcesRoutes);

app.use(errorHandler);
