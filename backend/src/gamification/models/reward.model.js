import { query } from '../../common/database/index.js';

export const rewardModel = {
  async list({ isActive = true } = {}) {
    const result = await query('SELECT * FROM rewards WHERE is_active = $1 ORDER BY points_cost ASC', [isActive]);
    return result.rows;
  },

  async findById(id) {
    const result = await query('SELECT * FROM rewards WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async redeem(userId, rewardId) {
    const result = await query(
      `WITH user_pts AS (SELECT total_points FROM student_points WHERE user_id = $1),
            reward AS (SELECT * FROM rewards WHERE id = $2 AND is_active = TRUE AND (quantity_available = -1 OR quantity_available > 0))
       SELECT * FROM user_pts, reward`,
      [userId, rewardId]
    );
    if (result.rows.length === 0) return null;

    const userPts = parseInt(result.rows[0].total_points);
    const cost = parseInt(result.rows[0].points_cost);
    if (userPts < cost) return null;

    const client = await (await import('../../common/database/index.js')).getClient();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE student_points SET total_points = total_points - $1 WHERE user_id = $2', [cost, userId]);
      await client.query('INSERT INTO user_rewards (reward_id, user_id, status) VALUES ($1, $2, \'pending\')', [rewardId, userId]);
      await client.query('UPDATE rewards SET quantity_available = quantity_available - 1 WHERE id = $1 AND quantity_available > 0', [rewardId]);
      await client.query('COMMIT');
      return { success: true };
    } catch {
      await client.query('ROLLBACK');
      throw new Error('Redemption failed');
    } finally {
      client.release();
    }
  },

  async listUserRewards(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT ur.*, r.name, r.description, r.image_url, r.points_cost
       FROM user_rewards ur
       JOIN rewards r ON r.id = ur.reward_id
       WHERE ur.user_id = $1
       ORDER BY ur.redeemed_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM user_rewards WHERE user_id = $1', [userId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },
};

export default rewardModel;