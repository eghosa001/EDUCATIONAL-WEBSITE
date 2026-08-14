import { query } from '../../common/database/index.js';

export const badgeModel = {
  async list({ isActive = true } = {}) {
    const result = await query(
      'SELECT * FROM badges WHERE is_active = $1 ORDER BY xp_reward ASC',
      [isActive]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query('SELECT * FROM badges WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCode(code) {
    const result = await query('SELECT * FROM badges WHERE code = $1', [code]);
    return result.rows[0] || null;
  },
};

export default badgeModel;