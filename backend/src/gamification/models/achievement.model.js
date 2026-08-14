import { query } from '../../common/database/index.js';

export const achievementModel = {
  async listByUser(userId) {
    const result = await query(
      `SELECT a.*, sa.earned_at, sa.metadata
       FROM achievements sa
       JOIN badges a ON a.id = sa.badge_id
       WHERE sa.user_id = $1
       ORDER BY sa.earned_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async create(userId, badgeId) {
    const result = await query(
      `INSERT INTO achievements (user_id, badge_id) VALUES ($1, $2)
       ON CONFLICT (user_id, badge_id) DO NOTHING
       RETURNING *`,
      [userId, badgeId]
    );
    return result.rows[0] || null;
  },

  async checkAndAward(userId) {
    const pointsResult = await query('SELECT total_points FROM student_points WHERE user_id = $1', [userId]);
    const totalPoints = parseInt(pointsResult.rows[0]?.total_points || 0);

    const badgesResult = await query(
      `SELECT b.* FROM badges b
       WHERE b.criteria->>'xp_threshold' IS NOT NULL
       AND (b.criteria->>'xp_threshold')::int <= $1
       AND b.is_active = TRUE
       AND NOT EXISTS (SELECT 1 FROM achievements a WHERE a.badge_id = b.id AND a.user_id = $1)`,
      [totalPoints]
    );

    for (const badge of badgesResult.rows) {
      await this.create(userId, badge.id);
    }
    return badgesResult.rows;
  },
};

export default achievementModel;