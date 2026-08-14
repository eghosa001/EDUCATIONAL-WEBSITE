import { query } from '../../common/database/index.js';

export const settingsService = {
  async get(key) {
    const result = await query('SELECT * FROM system_settings WHERE key = $1', [key]);
    return result.rows[0] || null;
  },

  async getAll() {
    const result = await query('SELECT * FROM system_settings ORDER BY key ASC');
    return result.rows;
  },

  async set(key, value, userId) {
    const result = await query(
      `INSERT INTO system_settings (key, value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING *`,
      [key, value, userId]
    );
    return result.rows[0] || null;
  },
};

export default settingsService;
