import { query } from '../../common/database/index.js';

export const notificationModel = {
  async create(data) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, data, action_url, channel)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.userId, data.type, data.title, data.body, data.data || '{}', data.actionUrl || null, data.channel || 'in_app']
    );
    return result.rows[0];
  },

  async listByUser(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1', [userId]);
    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) },
    };
  },

  async markAsRead(notificationId, userId) {
    const result = await query(
      `UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0] || null;
  },

  async markAllAsRead(userId) {
    await query('UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = $1 AND read_at IS NULL', [userId]);
    return { success: true };
  },

  async bulkCreate(notifications) {
    if (!notifications.length) return [];
    const placeholders = notifications.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(', ');
    const values = notifications.flatMap(n => [n.userId, n.type, n.title, n.body, n.data || '{}', n.actionUrl || null, n.channel || 'in_app']);
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, data, action_url, channel) VALUES ${placeholders} RETURNING *`,
      values
    );
    return result.rows;
  },
};

export default notificationModel;