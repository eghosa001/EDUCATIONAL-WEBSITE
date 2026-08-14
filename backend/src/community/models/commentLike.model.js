import { query } from '../../common/database/index.js';

export const commentLikeModel = {
  async findByCommentAndUser(commentId, userId) {
    const result = await query('SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
    return result.rows[0] || null;
  },

  async add(commentId, userId) {
    const result = await query(
      `INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)
       ON CONFLICT (comment_id, user_id) DO NOTHING
       RETURNING *`,
      [commentId, userId]
    );
    return result.rows[0];
  },

  async remove(commentId, userId) {
    const result = await query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING *', [commentId, userId]);
    return result.rows[0] || null;
  },
};

export default commentLikeModel;