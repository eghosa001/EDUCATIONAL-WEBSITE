import { query } from '../../common/database/index.js';

export const studyGroupMemberModel = {
  async listByGroup(groupId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT sgm.*, u.first_name, u.last_name, u.avatar_url, u.email
       FROM study_group_members sgm
       JOIN users u ON u.id = sgm.user_id
       WHERE sgm.group_id = $1
       ORDER BY sgm.joined_at ASC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM study_group_members WHERE group_id = $1', [groupId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async findByGroupAndUser(groupId, userId) {
    const result = await query('SELECT * FROM study_group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    return result.rows[0] || null;
  },

  async add(groupId, userId, role = 'member') {
    const result = await query(
      `INSERT INTO study_group_members (group_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [groupId, userId, role]
    );
    return result.rows[0];
  },

  async remove(groupId, userId) {
    const result = await query('DELETE FROM study_group_members WHERE group_id = $1 AND user_id = $2 RETURNING *', [groupId, userId]);
    return result.rows[0] || null;
  },
};

export default studyGroupMemberModel;