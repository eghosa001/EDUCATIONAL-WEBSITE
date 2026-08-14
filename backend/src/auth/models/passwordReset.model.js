import { query } from '../../common/database/index.js';

export const passwordResetModel = {
  async create({ userId, tokenHash, expiresAt }) {
    const result = await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return result.rows[0];
  },

  async findByTokenHash(tokenHash) {
    const result = await query('SELECT * FROM password_resets WHERE token_hash = $1', [tokenHash]);
    return result.rows[0] || null;
  },

  async markUsed(id) {
    const result = await query(
      'UPDATE password_resets SET used_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  async invalidateForUser(userId) {
    await query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [userId]);
  },

  async deleteExpired() {
    const result = await query('DELETE FROM password_resets WHERE expires_at < NOW() OR used_at IS NOT NULL');
    return result.rowCount;
  },
};

export default passwordResetModel;
