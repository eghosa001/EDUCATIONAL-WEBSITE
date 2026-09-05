// External packages
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Database
import { pool, poolReady, useSupabase } from './common/database/index.js';
import { config } from './common/config/index.js';
import { errorHandler, notFoundHandler, rateLimiter, corsOptions, requestLogger } from './common/middleware/index.js';
import { apiRoutes } from './routes/api.routes.js';

const app = express();
if (process.env.VERCEL) app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({
  limit: process.env.API_BODY_LIMIT || '5mb',
  verify: (req, _res, buffer) => { req.rawBody = buffer.toString('utf8'); },
}));
app.use(express.urlencoded({ extended: true, limit: process.env.API_BODY_LIMIT || '5mb' }));

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
  res.cookie = (name, value, options = {}) => { res.append('Set-Cookie', serializeCookie(name, value, options)); return res; };
  res.clearCookie = (name, options = {}) => { res.append('Set-Cookie', serializeCookie(name, '', { ...options, maxAge: 0 })); return res; };
  next();
});

if (config.env !== 'test') app.use(morgan('combined'));
app.use(requestLogger);
app.use(rateLimiter);

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1')) return next();
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Use /api/v1/ instead of /api/' } });
});

app.get('/health', async (_req, res) => {
  let healthy = false;
  try {
    await poolReady;
    if (useSupabase) {
      const { supabaseQuery } = await import('./common/database/index.js');
      await supabaseQuery('users', { select: 'id', limit: 1 });
      healthy = true;
    } else {
      const r = await pool.query('SELECT 1');
      healthy = r?.rowCount > 0;
    }
  } catch (e) {
    console.error('[health] Database connectivity check failed:', e.message);
  }
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'Educational Platform API is running' : 'API database connectivity degraded',
    timestamp: new Date().toISOString(),
  });
});

app.use(config.apiPrefix, apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default async function handler(req, res) { return app(req, res); }

if (!process.env.VERCEL) {
  const startServer = async () => {
    try { await app.listen(config.port, () => console.log(`Server running on port ${config.port} in ${config.env} mode`)); }
    catch (error) { console.error('Failed to start server:', error); process.exit(1); }
  };
  process.on('SIGTERM', async () => { if (pool) await pool.end(); process.exit(0); });
  process.on('SIGINT', async () => { if (pool) await pool.end(); process.exit(0); });
  process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
  process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); process.exit(1); });
  startServer();
}
