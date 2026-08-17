import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

const isSupabase = !!config.supabase.url && !!config.supabase.dbPassword;

let pool;

if (isSupabase) {
  const projectId = config.supabase.projectId;
  const dbHost = `db.${projectId}.supabase.co`;
  const dbPort = 5432;
  const dbUser = 'postgres';
  const dbPassword = config.supabase.dbPassword;
  const dbName = 'postgres';

  pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: { rejectUnauthorized: false },
    min: config.database.pool.min,
    max: config.database.pool.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
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
}

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export { pool };

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

export const closePool = async () => {
  await pool.end();
};

export default { pool, query, getClient, transaction, closePool };
