import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/common/database/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCHEMA_FILES = [
  'migrate-phase4.sql',
  'init-db.sql',
  'migrate-phase5.sql',
];

const run = async () => {
  const client = await pool.connect();
  try {
    for (const file of SCHEMA_FILES) {
      const path = join(__dirname, file);
      let sql;
      try {
        sql = await readFile(path, 'utf8');
      } catch {
        console.log(`Skipping missing migration: ${file}`);
        continue;
      }
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Migration applied: ${file}`);
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
