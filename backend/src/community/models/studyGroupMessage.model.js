import { query } from '../../common/database/index.js';

export const studyGroupMessageModel = {
  async listByGroup(groupId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT sgm.*, u.first_name, u.last_name, u.avatar_url
       FROM study_group_messages sgm
       JOIN users u ON u.id = sgm.author_id
       WHERE sgm.group_id = $1
       ORDER BY sgm.created_at ASC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM study_group_messages WHERE group_id = $1', [groupId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async create(data) {
    const result = await query(
      `INSERT INTO study_group_messages (group_id, author_id, content, attachments)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.groupId, data.authorId, data.content, data.attachments || []]
    );
    return result.rows[0];
  },

  async delete(id, userId) {
    const result = await query('DELETE FROM study_group_messages WHERE id = $1 AND author_id = $2 RETURNING *', [id, userId]);
    return result.rows[0] || null;
  },
};

export default studyGroupMessageModel;