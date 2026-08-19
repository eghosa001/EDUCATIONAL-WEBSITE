import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

let pool;

async function tryConnect(options) {
  const p = new Pool(options);
  try {
    await p.query('SELECT 1');
    return p;
  } catch {
    await p.end();
    return null;
  }
}

async function initPool() {
  // If Supabase credentials are set, try Supabase first; fall back to local PG
  if (config.supabase.url && config.supabase.dbPassword) {
    const projectId = config.supabase.projectId;
    const supabaseOpts = {
      host: `db.${projectId}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: config.supabase.dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      min: config.database.pool.min,
      max: config.database.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
    pool = await tryConnect(supabaseOpts);
    if (pool) {
      console.log('Connected to Supabase PostgreSQL');
    } else {
      console.log('Supabase unavailable, falling back to local PostgreSQL');
    }
  }

  if (!pool) {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.name,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      min: config.database.pool.min,
      max: config.database.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    console.log(`Connected to local PostgreSQL at ${config.database.host}:${config.database.port}`);
  }

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
}

initPool().catch(err => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});

export { pool };

/**
 * Sets PostgreSQL session variables from a verified JWT payload.
 * Call this BEFORE any query when you need RLS policies to respect user identity.
 * The middleware authMiddleware already populates req.user with { id, role, permissions }.
 * @param {pg.Client} client - The database client to configure
 * @param {object} user - Verified user object with at minimum an `id` field (UUID string)
 */
export const setJwtContext = (client, user) => {
  if (!user?.id) return;
  const jwtClaims = JSON.stringify({ sub: user.id, role: user.role || 'student' });
  client.query(`SET request.jwt.claims = $1`, [jwtClaims]);
  client.query(`SET request.jwt.issue_time = NOW()`);
};

export const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.env === 'development') {
    console.log('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  return result;
};

export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  client.query = async (...args) => {
    const start = Date.now();
    const result = await originalQuery(...args);
    const duration = Date.now() - start;
    if (config.env === 'development') {
      console.log('Client query', { text: args[0]?.substring(0, 100), duration, rows: result.rowCount });
    }
    return result;
  };

  client.release = () => {
    client.query = originalQuery;
    return originalRelease();
  };

  return client;
};

/**
 * Acquires a client and sets JWT context for RLS compliance.
 * Use this in place of getClient() when you have a verified user.
 * @param {object} user - Verified user object from authMiddleware (req.user)
 */
export const getClientWithUser = async (user) => {
  const client = await getClient();
  setJwtContext(client, user);
  return client;
};

export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Transaction variant that accepts a user for RLS context.
 */
export const transactionWithUser = async (user, callback) => {
  const client = await getClientWithUser(user);
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = async () => {
  await pool.end();
};

export default { pool, query, getClient, getClientWithUser, transaction, transactionWithUser, closePool, setJwtContext };
