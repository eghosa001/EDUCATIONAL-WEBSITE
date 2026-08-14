import { query } from '../../common/database/index.js';

export const studyGroupModel = {
  async list({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT sg.*, u.first_name, u.last_name, u.avatar_url
       FROM study_groups sg
       JOIN users u ON u.id = sg.creator_id
       ORDER BY sg.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM study_groups');
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async findById(id) {
    const result = await query(
      `SELECT sg.*, u.first_name, u.last_name, u.avatar_url
       FROM study_groups sg
       JOIN users u ON u.id = sg.creator_id
       WHERE sg.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByJoinCode(code) {
    const result = await query('SELECT * FROM study_groups WHERE join_code = $1', [code]);
    return result.rows[0] || null;
  },

  async create(data) {
    let joinCode = null;
    if (data.isPrivate) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await this.findByJoinCode(joinCode);
      if (existing) joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const result = await query(
      `INSERT INTO study_groups (name, description, subject_id, topic_id, creator_id, max_members, is_private, join_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.name, data.description || null, data.subjectId || null, data.topicId || null, data.creatorId, data.maxMembers || 100, data.isPrivate || false, joinCode]
    );
    return result.rows[0];
  },

  async update(id, userId, data) {
    const result = await query(
      `UPDATE study_groups SET
         name = COALESCE($3, name),
         description = COALESCE($4, description),
         subject_id = COALESCE($5, subject_id),
         topic_id = COALESCE($6, topic_id),
         max_members = COALESCE($7, max_members),
         is_private = COALESCE($8, is_private),
         updated_at = NOW()
       WHERE id = $1 AND creator_id = $2
       RETURNING *`,
      [id, userId, data.name, data.description, data.subjectId, data.topicId, data.maxMembers, data.isPrivate]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await query('DELETE FROM study_groups WHERE id = $1 AND creator_id = $2 RETURNING *', [id, userId]);
    return result.rows[0] || null;
  },

  async incrementMemberCount(id, delta) {
    await query('UPDATE study_groups SET member_count = GREATEST(0, member_count + $2) WHERE id = $1', [id, delta]);
  },
};

export default studyGroupModel;