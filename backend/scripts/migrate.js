import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/common/database/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, 'init-db.sql');

const run = async () => {
  const sql = await readFile(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT COUNT(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'"
    );
    if (rows[0].n > 0) {
      console.log('Schema already applied — nothing to migrate.');
    } else {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Migration applied.');
    }
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log(`Tables (${tables.rows.length}):`);
    console.log(tables.rows.map((r) => `  - ${r.tablename}`).join('\n'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
