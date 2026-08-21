// External packages
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Database
import { pool, query, getClient, transaction, poolReady, useSupabase } from './common/database/index.js';

// Constants
import { HTTP_STATUS, ERROR_CODES } from './common/constants/index.js';

// Errors
import { AppError, handleError, asyncHandler } from './common/errors/index.js';

// Config
import { config } from './common/config/index.js';

// Middleware
import {
  errorHandler,
  notFoundHandler,
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePermission,
  validateRequest,
  rateLimiter,
  authRateLimiter,
  corsOptions,
  requestLogger,
} from './common/middleware/index.js';

// Services
import flashcardService from './flashcards/services/flashcard.service.js';
import pastQuestionService from './past-questions/services/pastQuestion.service.js';
import assessmentEngine from './assessments/engine.js';
import contentApprovalService from './administration/services/workflow.service.js';
import notificationDispatcher from './notifications/dispatch.service.js';
import aiTutorService from './ai/tutor.service.js';
import liveClassService from './live-classes/services/liveClass.service.js';
import searchIndexer from './search/indexer.js';
import certificateService from './certificates/services/certificate.service.js';
import moderationService from './community/moderation.service.js';
import securityMiddleware from './common/middleware/security.js';

// Routes
import { apiRoutes } from './routes/api.routes.js';

const app = express();

if (process.env.VERCEL) {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// The authentication controller uses HttpOnly cookies, but the backend does
// not depend on cookie-parser. Implement the small subset of cookie response
// helpers we need so registration/login work in Vercel serverless mode too.
const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  parts.push(`Path=${options.path || '/'}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) {
    const sameSite = String(options.sameSite).toLowerCase();
    parts.push(`SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`);
  }
  return parts.join('; ');
};

app.use((req, res, next) => {
  res.cookie = (name, value, options = {}) => {
    res.append('Set-Cookie', serializeCookie(name, value, options));
    return res;
  };
  res.clearCookie = (name, options = {}) => {
    res.append('Set-Cookie', serializeCookie(name, '', { ...options, maxAge: 0 }));
    return res;
  };
  next();
});

if (config.env !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);
app.use(rateLimiter);

// Allow /api/v1/ — but block bare /api/ without version
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1')) return next();
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Use /api/v1/ instead of /api/' },
  });
});

app.get('/health', async (req, res) => {
  const dbStatus = { local: 'unknown', supabase: 'unknown', mode: 'unknown' };
  try {
    await poolReady;
    dbStatus.mode = useSupabase ? 'supabase-rest' : 'local-pg';
    if (useSupabase) {
      try {
        const { supabaseQuery } = await import('./common/database/index.js');
        const r = await supabaseQuery('users', { select: 'id', limit: 1 });
        dbStatus.supabase = r?.rows?.length > 0 ? 'ok' : 'reachable-no-response';
      } catch (e) {
        dbStatus.supabase = 'error: ' + e.message;
      }
    } else {
      try {
        const { pool } = await import('./common/database/index.js');
        const r = await pool.query('SELECT 1');
        dbStatus.local = r?.rowCount > 0 ? 'ok' : 'reachable-no-response';
      } catch (e) {
        dbStatus.local = 'error';
      }
    }
  } catch (e) {
    dbStatus.mode = 'connecting...';
  }
  const allOk = dbStatus.local === 'ok' || dbStatus.supabase === 'ok';
  res.status(allOk ? 200 : 503).json({
    success: allOk,
    message: allOk ? 'Educational Platform API is running' : 'API running but database connectivity degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
    database: dbStatus,
  });
});

app.use(config.apiPrefix, apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

// Serverless handler for Vercel
export default async function handler(req, res) {
  // Set req.ip for rate limiting
  req.ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  req.headers['user-agent'] = req.headers['user-agent'] || '';
  return app(req, res);
}

// Only start standalone server for local development
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await app.listen(config.port, () => {
        console.log(`Server running on port ${config.port} in ${config.env} mode`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => { pool.end(); process.exit(0); });
  process.on('SIGINT', () => { pool.end(); process.exit(0); });
  process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); });
  process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); process.exit(1); });

  startServer();
}
