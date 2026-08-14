import { query } from '../../common/database/index.js';

export const commentModel = {
  async listByPost(postId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 AND c.status = 'published'
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM comments WHERE post_id = $1 AND status = \'published\'', [postId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async findById(id) {
    const result = await query('SELECT * FROM comments WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const result = await query(
      `INSERT INTO comments (post_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.postId, data.userId, data.content, data.parentId || null]
    );
    return result.rows[0];
  },

  async update(id, userId, content) {
    const result = await query(
      `UPDATE comments SET content = $3, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, content]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await query('DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    return result.rows[0] || null;
  },

  async incrementLikeCount(id, delta) {
    await query('UPDATE comments SET likes_count = GREATEST(0, likes_count + $2) WHERE id = $1', [id, delta]);
  },
};

export default commentModel;