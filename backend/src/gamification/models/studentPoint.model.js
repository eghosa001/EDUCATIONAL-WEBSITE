import { query } from '../../common/database/index.js';

export const studentPointModel = {
  async findByUserId(userId) {
    const result = await query('SELECT * FROM student_points WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  async upsert(userId, data) {
    const result = await query(
      `INSERT INTO student_points (user_id, total_points, current_streak, longest_streak, level, xp_to_next_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         total_points = student_points.total_points + EXCLUDED.total_points,
         current_streak = GREATEST(student_points.current_streak, EXCLUDED.current_streak),
         longest_streak = GREATEST(student_points.longest_streak, EXCLUDED.longest_streak),
         level = CASE WHEN student_points.total_points >= 1000 THEN 10
                      WHEN student_points.total_points >= 500 THEN 5
                      WHEN student_points.total_points >= 100 THEN 3
                      WHEN student_points.total_points >= 50 THEN 2
                      ELSE 1 END,
         xp_to_next_level = CASE WHEN student_points.total_points >= 1000 THEN 0
                                 WHEN student_points.total_points >= 500 THEN 1000 - student_points.total_points
                                 WHEN student_points.total_points >= 100 THEN 500 - student_points.total_points
                                 WHEN student_points.total_points >= 50 THEN 100 - student_points.total_points
                                 ELSE 50 - student_points.total_points END,
         updated_at = NOW()
       RETURNING *`,
      [userId, data.points || 0, data.currentStreak || 0, data.longestStreak || 0, data.level || 1, data.xpToNextLevel || 100]
    );
    return result.rows[0];
  },

  async addPoints(userId, points) {
    const result = await query(
      `UPDATE student_points SET total_points = total_points + $2,
         current_streak = current_streak + 1,
         level = CASE WHEN total_points + $2 >= 1000 THEN 10
                      WHEN total_points + $2 >= 500 THEN 5
                      WHEN total_points + $2 >= 100 THEN 3
                      WHEN total_points + $2 >= 50 THEN 2
                      ELSE 1 END,
         xp_to_next_level = CASE WHEN total_points + $2 >= 1000 THEN 0
                                 WHEN total_points + $2 >= 500 THEN 1000 - (total_points + $2)
                                 WHEN total_points + $2 >= 100 THEN 500 - (total_points + $2)
                                 WHEN total_points + $2 >= 50 THEN 100 - (total_points + $2)
                                 ELSE 50 - (total_points + $2) END,
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, points]
    );
    if (!result.rows[0]) {
      const newResult = await query(
        `INSERT INTO student_points (user_id, total_points, current_streak, longest_streak, level, xp_to_next_level)
         VALUES ($1, $2, 1, 1, CASE WHEN $2 >= 1000 THEN 10 WHEN $2 >= 500 THEN 5 WHEN $2 >= 100 THEN 3 WHEN $2 >= 50 THEN 2 ELSE 1 END,
                 CASE WHEN $2 >= 1000 THEN 0 WHEN $2 >= 500 THEN 1000 - $2 WHEN $2 >= 100 THEN 500 - $2 WHEN $2 >= 50 THEN 100 - $2 ELSE 50 - $2 END)
         RETURNING *`,
        [userId, points]
      );
      return newResult.rows[0];
    }
    return result.rows[0];
  },

  async getLeaderboard({ page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT sp.*, u.first_name, u.last_name, u.avatar_url
       FROM student_points sp
       JOIN users u ON u.id = sp.user_id
       ORDER BY sp.total_points DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM student_points');
    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) },
    };
  },
};

export default studentPointModel;