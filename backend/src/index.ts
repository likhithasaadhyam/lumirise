import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import manufacturingRoutes from './routes/manufacturing.js';
import inventoryRoutes from './routes/inventory.js';
import crmRoutes from './routes/crm.js';
import hrmsRoutes from './routes/hrms.js';
import reportsRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import notificationsRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';
import orgRoutes from './routes/organization.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Request logger for visibility
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', platform: 'Lumirise ERP Core API', version: '1.0.0' });
});

// Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/hrms', hrmsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/organization', orgRoutes);

// Global Error Handler - Sanitized for Enterprise Security & User-Friendly UX
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Enterprise Error Handler]', err);

  // Prisma Unique Constraint Violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target) : 'field';
    return res.status(409).json({
      message: `A record with this ${fields} already exists. Please choose another value.`,
      code: 'DUPLICATE_RESOURCE',
    });
  }

  // Prisma Foreign Key Constraint Violation
  if (err.code === 'P2003') {
    return res.status(400).json({
      message: 'This operation references data that does not exist or has active dependencies.',
      code: 'CONSTRAINT_VIOLATION',
    });
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return res.status(404).json({
      message: 'The requested resource was not found.',
      code: 'NOT_FOUND',
    });
  }

  // 403 Forbidden
  if (err.status === 403 || err.statusCode === 403) {
    return res.status(403).json({
      message: err.message || "You don't have permission to perform this action.",
      code: 'FORBIDDEN',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected system error occurred. Please try again later.' : (err.message || 'Error occurred'),
    code: err.code || 'SERVER_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Lumirise Enterprise API running on http://localhost:${PORT}`);
});
