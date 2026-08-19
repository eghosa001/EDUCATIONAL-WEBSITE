import pg from 'pg';
import { config } from '../config/index.js';
import { createSupabaseClient } from '../supabase/index.js';

const { Pool } = pg;

export let useSupabase = false;
let pool;
let supabaseClient;

// Resolves when pool is ready (local mode only)
export const poolReady = new Promise((resolve) => {
  if (process.env.VERCEL) {
    useSupabase = true;
    supabaseClient = createSupabaseClient(true);
    console.log('Using Supabase REST API (serverless mode)');
    resolve();
    return;
  }

  async function connect() {
    // Try Supabase direct PostgreSQL first
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
      const p = new Pool(supabaseOpts);
      try {
        await p.query('SELECT 1');
        pool = p;
        console.log('Connected to Supabase PostgreSQL');
        resolve();
        return;
      } catch {
        await p.end();
        console.log('Supabase direct connection unavailable, trying local PostgreSQL');
      }
    }

    // Fall back to local PostgreSQL
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
    resolve();
  }

  connect().catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
});

poolReady.catch(() => {}); // prevent unhandled rejection

export { pool };

pool?.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// ---------- Supabase REST API helpers ----------

const SUPABASE_URL = config.supabase.url;
const SUPABASE_KEY = config.supabase.serviceRoleKey;

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

/**
 * Execute a SELECT query via Supabase REST API.
 * Supports simple WHERE filters; complex JOINs/aggregates must be handled in the caller.
 */
export const supabaseQuery = async (table, options = {}) => {
  const { select = '*', filters = {}, order = null, limit = null, offset = null } = options;

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const params = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && value.op) {
        params.push(`${key}.${value.op}=${encodeURIComponent(value.val)}`);
      } else {
        params.push(`${key}=eq.${encodeURIComponent(String(value))}`);
      }
    }
  }
  if (params.length > 0) url += '&' + params.join('&');
  if (order) url += `&order=${encodeURIComponent(order)}`;
  if (limit) url += `&limit=${encodeURIComponent(limit)}`;
  if (offset) url += `&offset=${encodeURIComponent(offset)}`;

  const res = await fetch(url, { headers: supabaseHeaders });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return { rows: data, rowCount: data.length };
};

/**
 * Execute an INSERT via Supabase REST API.
 */
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
  return { rows: Array.isArray(result) ? result : [result], rowCount: 1 };
};

/**
 * Execute an UPDATE via Supabase REST API.
 */
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
  return { rows: Array.isArray(dataResult) ? dataResult : [dataResult], rowCount: dataResult.length };
};

/**
 * Execute a DELETE via Supabase REST API.
 */
export const supabaseDelete = async (table, filters) => {
  const paramStr = Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
    .join('&');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${paramStr}`, {
    method: 'DELETE',
    headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
  });
  return { rows: [], rowCount: res.status === 204 ? 1 : 0 };
};

// ---------- Public API ----------

/**
 * Primary query function — works with both local PG and Supabase REST.
 * For Supabase mode, passes raw SQL through a passthrough that the caller
 * must handle ( Supabase REST doesn't support arbitrary SQL).
 * In practice, callers should use the typed helpers below.
 */
export const query = async (text, params) => {
  if (useSupabase) {
    throw new Error(
      'Raw SQL queries are not supported in Supabase REST mode. ' +
      'Use supabaseQuery/supabaseInsert/supabaseUpdate/supabaseDelete instead.'
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
  if (useSupabase) {
    const res = await supabaseQuery(table, {
      select: '*',
      filters: { [idColumn]: idValue },
      limit: 1,
    });
    return res.rows[0] || null;
  }
  const result = await pool.query(`SELECT * FROM ${table} WHERE ${idColumn} = $1 LIMIT 1`, [idValue]);
  return result.rows[0] || null;
};

export const getClient = async () => {
  if (useSupabase) {
    throw new Error('getClient is not available in Supabase REST mode. Use supabaseQuery instead.');
  }
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
  if (useSupabase) {
    throw new Error('Transactions are not supported in Supabase REST mode.');
  }
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
  if (!useSupabase && pool) {
    await pool.end();
  }
};

export const setJwtContext = () => {
  // No-op in Supabase REST mode (RLS is bypassed via service_role key)
  // In local mode, this was used for RLS — no longer needed with service_role
};

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
