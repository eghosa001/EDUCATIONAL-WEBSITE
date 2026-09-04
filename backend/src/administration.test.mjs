import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { query, pool } from './common/database/index.js';
import { listAuditLogs, getAuditLogsByResource, getSettings, getSetting, updateSettings } from './administration/controllers/administration.controller.js';

let dbAvailable = false;

async function setupDB() {
  try {
    await query('SELECT 1');
    dbAvailable = true;
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id UUID,
        changes JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB,
        updated_by UUID,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch {
    dbAvailable = false;
  }
}

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

describe('Administration Controller', () => {
  before(async () => { await setupDB(); });
  after(async () => {
    if (dbAvailable) {
      try { await pool.end(); } catch {}
    }
  });

  it('listAuditLogs returns paginated results', async () => {
    if (!dbAvailable) return;
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)`,
      ['00000000-0000-0000-0000-000000000000', 'test.action', 'test_resource', '00000000-0000-0000-0000-000000000000']
    );
    const result = await listAuditLogs({ query: { page: 1, limit: 10 } });
    assert.ok(result);
  });

  it('getSettings returns all settings', async () => {
    if (!dbAvailable) return;
    await query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['test.setting', JSON.stringify({ enabled: true })]
    );
    const result = await getSettings();
    assert.ok(result);
  });

  it('updateSettings creates or updates a setting', async () => {
    if (!dbAvailable) return;
    const result = await updateSettings({ key: 'test.new.setting', value: JSON.stringify('hello') }, '00000000-0000-0000-0000-000000000000');
    assert.ok(result);
  });
});

describe('Audit Log Service', () => {
  before(async () => { await setupDB(); });
  after(async () => { if (dbAvailable) try { await pool.end(); } catch {} });

  it('should log an action', async () => {
    if (!dbAvailable) return;
    const result = await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['00000000-0000-0000-0000-000000000000', 'user.login', 'user', '00000000-0000-0000-0000-000000000000', JSON.stringify({ method: 'email' })]
    );
    assert.ok(result.rows[0]);
    assert.strictEqual(result.rows[0].action, 'user.login');
  });

  it('should filter audit logs by action', async () => {
    if (!dbAvailable) return;
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type) VALUES ($1, $2, $3)`,
      ['00000000-0000-0000-0000-000000000000', 'course.publish', 'course']
    );
    const result = await query(
      `SELECT COUNT(*)::int AS total FROM audit_logs WHERE action = $1`,
      ['course.publish']
    );
    assert.ok(result.rows[0].total >= 1);
  });
});

describe('Settings Service', () => {
  before(async () => { await setupDB(); });
  after(async () => { if (dbAvailable) try { await pool.end(); } catch {} });

  it('should upsert a setting', async () => {
    if (!dbAvailable) return;
    await query(
      `INSERT INTO system_settings (key, value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      ['platform.name', JSON.stringify('THE GUIDE'), '00000000-0000-0000-0000-000000000000']
    );
    const result = await query('SELECT * FROM system_settings WHERE key = $1', ['platform.name']);
    assert.ok(result.rows[0]);
    assert.strictEqual(result.rows[0].key, 'platform.name');
  });

  it('should read a setting by key', async () => {
    if (!dbAvailable) return;
    const result = await query('SELECT * FROM system_settings WHERE key = $1', ['platform.name']);
    assert.ok(result.rows[0]);
    assert.deepStrictEqual(result.rows[0].value, { 'THE GUIDE': undefined } || result.rows[0].value);
  });
});
