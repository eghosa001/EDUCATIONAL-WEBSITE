import { query } from '../../common/database/index.js';

export const postLikeModel = {
  async findByPostAndUser(postId, userId) {
    const result = await query('SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    return result.rows[0] || null;
  },

  async add(postId, userId) {
    const result = await query(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING *`,
      [postId, userId]
    );
    return result.rows[0];
  },

  async remove(postId, userId) {
    const result = await query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING *', [postId, userId]);
    return result.rows[0] || null;
  },
};

export default postLikeModel;