import { query } from '../../common/database/index.js';

export const parentChildModel = {
  async findById(id) {
    const result = await query('SELECT * FROM parent_children WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByParentAndChild(parentId, childUserId) {
    const result = await query(
      'SELECT * FROM parent_children WHERE parent_id = $1 AND child_user_id = $2',
      [parentId, childUserId]
    );
    return result.rows[0] || null;
  },

  async listByParent(parentId) {
    const result = await query(
      `SELECT pc.*, u.first_name, u.last_name, u.email, u.avatar_url
       FROM parent_children pc
       JOIN users u ON u.id = pc.child_user_id
       WHERE pc.parent_id = $1
       ORDER BY pc.created_at DESC`,
      [parentId]
    );
    return result.rows;
  },

  async create(data) {
    const { parentId, childUserId, relationship, preferredContactMethod, notificationsEnabled } = data;
    const result = await query(
      `INSERT INTO parent_children (
         parent_id, child_user_id, relationship, preferred_contact_method, notifications_enabled
       ) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (parent_id, child_user_id) DO NOTHING
       RETURNING *`,
      [parentId, childUserId, relationship ?? null, preferredContactMethod ?? 'sms', notificationsEnabled ?? true]
    );
    return result.rows[0] || null;
  },

  async delete(parentId, childUserId) {
    const result = await query(
      'DELETE FROM parent_children WHERE parent_id = $1 AND child_user_id = $2 RETURNING id',
      [parentId, childUserId]
    );
    return result.rows[0] || null;
  },
};

export default parentChildModel;
