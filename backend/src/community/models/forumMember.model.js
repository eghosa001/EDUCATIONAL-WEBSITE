import { query } from '../../common/database/index.js';

export const forumMemberModel = {
  async listByForum(forumId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT fm.*, u.first_name, u.last_name, u.email, u.avatar_url
       FROM forum_members fm
       JOIN users u ON u.id = fm.user_id
       WHERE fm.forum_id = $1
       ORDER BY fm.joined_at ASC
       LIMIT $2 OFFSET $3`,
      [forumId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM forum_members WHERE forum_id = $1', [forumId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async findByForumAndUser(forumId, userId) {
    const result = await query('SELECT * FROM forum_members WHERE forum_id = $1 AND user_id = $2', [forumId, userId]);
    return result.rows[0] || null;
  },

  async add(forumId, userId, role = 'member') {
    const result = await query(
      `INSERT INTO forum_members (forum_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (forum_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [forumId, userId, role]
    );
    return result.rows[0];
  },

  async remove(forumId, userId) {
    const result = await query('DELETE FROM forum_members WHERE forum_id = $1 AND user_id = $2 RETURNING *', [forumId, userId]);
    return result.rows[0] || null;
  },
};

export default forumMemberModel;