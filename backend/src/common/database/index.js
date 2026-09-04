import pg from 'pg';
import { config } from '../config/index.js';
import { createSupabaseClient } from '../supabase/index.js';

const { Pool } = pg;

export let useSupabase = false;
let pool;
let supabaseClient;

const createPostgresPool = () => {
  const projectId = config.supabase.projectId;
  const host = process.env.SUPABASE_DB_HOST || (projectId ? `db.${projectId}.supabase.co` : config.database.host);
  const port = parseInt(process.env.SUPABASE_DB_PORT || '5432', 10);
  const user = process.env.SUPABASE_DB_USER || 'postgres';
  const password = config.supabase.dbPassword;
  const database = process.env.SUPABASE_DB_NAME || 'postgres';

  return new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    min: config.database.pool.min,
    max: config.database.pool.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
};

// Resolves when the database is ready.
// On Vercel, prefer a Supabase PostgreSQL connection when the DB password is
// configured. This preserves the existing SQL-based models and avoids forcing
// every model through the limited PostgREST query builder.
export const poolReady = new Promise((resolve) => {
  async function connect() {
    if (process.env.VERCEL && config.supabase.dbPassword) {
      const p = createPostgresPool();
      try {
        await p.query('SELECT 1');
        pool = p;
        useSupabase = false;
        console.log('Using Supabase PostgreSQL from Vercel');
        resolve();
        return;
      } catch (err) {
        await p.end().catch(() => {});
        console.warn('Supabase PostgreSQL connection unavailable; falling back to Supabase REST:', err.message);
      }
    }

    if (process.env.VERCEL) {
      useSupabase = true;
      supabaseClient = createSupabaseClient(true);
      console.log('Using Supabase REST API (serverless fallback mode)');
      resolve();
      return;
    }

    if (config.supabase.url && config.supabase.dbPassword) {
      const p = createPostgresPool();
      try {
        await p.query('SELECT 1');
        pool = p;
        useSupabase = false;
        console.log('Connected to Supabase PostgreSQL');
        resolve();
        return;
      } catch {
        await p.end().catch(() => {});
        console.log('Supabase direct connection unavailable, trying local PostgreSQL');
      }
    }

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
    useSupabase = false;
    console.log(`Connected to local PostgreSQL at ${config.database.host}:${config.database.port}`);
    resolve();
  }

  connect().catch(err => {
    console.error('Failed to initialize database:', err.message);
  });
});

poolReady.catch(() => {});

export { pool };

// ---------- Supabase REST API helpers ----------

const SUPABASE_URL = config.supabase.url;
const SUPABASE_KEY = config.supabase.serviceRoleKey;

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export const supabaseQuery = async (table, options = {}) => {
  const { select = '*', filters = {}, order = null, limit = null, offset = null } = options;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const params = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    if (key === 'or' || key === '_or') {
      params.push(`or=${encodeURIComponent(String(value))}`);
    } else if (typeof value === 'object' && value.op) {
      params.push(`${key}=${value.op}.${encodeURIComponent(value.val)}`);
    } else {
      params.push(`${key}=eq.${encodeURIComponent(String(value))}`);
    }
  }

  if (params.length > 0) url += '&' + params.join('&');
  if (order) url += `&order=${encodeURIComponent(order)}`;
  if (limit !== null && limit !== undefined) url += `&limit=${encodeURIComponent(limit)}`;
  if (offset !== null && offset !== undefined) url += `&offset=${encodeURIComponent(offset)}`;

  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return { rows: data, rowCount: data.length };
};

export const supabaseInsert = async (table, insertData) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify(insertData),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${text}`);
  }
  const result = await res.json();
  return { rows: Array.isArray(result) ? result : [result], rowCount: Array.isArray(result) ? result.length : 1 };
};

export const supabaseUpdate = async (table, data, filters) => {
  const paramStr = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
    .join('&');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${paramStr}`, {
    method: 'PATCH',
    headers: supabaseHeaders,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase update failed (${res.status}): ${text}`);
  }
  const dataResult = await res.json();
  return { rows: Array.isArray(dataResult) ? dataResult : [dataResult], rowCount: Array.isArray(dataResult) ? dataResult.length : 1 };
};

export const supabaseDelete = async (table, filters) => {
  const paramStr = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
    .join('&');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${paramStr}`, {
    method: 'DELETE',
    headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase delete failed (${res.status}): ${text}`);
  }
  return { rows: [], rowCount: 0 };
};

export const query = async (text, params) => {
  await poolReady;
  if (useSupabase) {
    throw new Error(
      'Raw SQL queries are not supported in Supabase REST fallback mode. ' +
      'Configure SUPABASE_DB_PASSWORD (and optionally SUPABASE_DB_HOST) for production SQL models.'
    );
  }
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.env === 'development') {
    console.log('Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  return result;
};

export const getByTable = async (table, idColumn, idValue) => {
  await poolReady;
  if (useSupabase) {
    const res = await supabaseQuery(table, { select: '*', filters: { [idColumn]: idValue }, limit: 1 });
    return res.rows[0] || null;
  }
  const result = await pool.query(`SELECT * FROM ${table} WHERE ${idColumn} = $1 LIMIT 1`, [idValue]);
  return result.rows[0] || null;
};

export const getClient = async () => {
  await poolReady;
  if (useSupabase) throw new Error('getClient is not available in Supabase REST fallback mode.');
  return pool.connect();
};

export const transaction = async (callback) => {
  await poolReady;
  if (useSupabase) throw new Error('Transactions are not supported in Supabase REST fallback mode.');
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
  await poolReady.catch(() => {});
  if (!useSupabase && pool) await pool.end();
};

export const setJwtContext = () => {};

export default {
  pool,
  query,
  getClient,
  getClientWithUser: getClient,
  transaction,
  transactionWithUser: transaction,
  closePool,
  setJwtContext,
  poolReady,
  useSupabase,
  supabaseQuery,
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
  getByTable,
};
