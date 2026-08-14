import { query } from '../../common/database/index.js';

export const sessionModel = {
  async create(data) {
    const { userId, tokenHash, refreshTokenHash, deviceInfo, ipAddress, userAgent, expiresAt } = data;
    const result = await query(
      `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, tokenHash, refreshTokenHash, deviceInfo, ipAddress, userAgent, expiresAt]
    );
    return result.rows[0];
  },

  async findByTokenHash(tokenHash) {
    const result = await query('SELECT * FROM sessions WHERE token_hash = $1', [tokenHash]);
    return result.rows[0] || null;
  },

  async findByRefreshTokenHash(refreshTokenHash) {
    const result = await query('SELECT * FROM sessions WHERE refresh_token_hash = $1', [refreshTokenHash]);
    return result.rows[0] || null;
  },

  async listByUser(userId) {
    const result = await query('SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  },

  async revoke(id) {
    const result = await query('DELETE FROM sessions WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async revokeAllForUser(userId, excludeId) {
    const values = [userId];
    let excludeClause = '';
    if (excludeId) {
      values.push(excludeId);
      excludeClause = `AND id != $${values.length}`;
    }
    await query(`DELETE FROM sessions WHERE user_id = $1 ${excludeClause}`, values);
  },

  async deleteExpired() {
    const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');
    return result.rowCount;
  },
};

export default sessionModel;
