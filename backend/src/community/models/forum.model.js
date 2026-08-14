import { query } from '../../common/database/index.js';
import { slugify } from '../../common/utils/index.js';

export const forumModel = {
  async list({ page = 1, limit = 20, isPublic } = {}) {
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let whereClause = 'WHERE f.is_public = TRUE';
    if (isPublic === false) whereClause = 'WHERE f.is_public = FALSE';
    else if (isPublic === true) whereClause = 'WHERE f.is_public = TRUE';

    const result = await query(
      `SELECT f.*, u.first_name, u.last_name
       FROM forums f
       LEFT JOIN users u ON u.id = f.created_by
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM forums ${whereClause}`);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async findById(id) {
    const result = await query('SELECT * FROM forums WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT * FROM forums WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async create(data) {
    let slug = slugify(data.name);
    const existing = await this.findBySlug(slug);
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const result = await query(
      `INSERT INTO forums (name, slug, description, subject_id, class_id, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, slug, data.description || null, data.subjectId || null, data.classId || null, data.isPublic ?? true, data.createdBy || null]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE forums SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         subject_id = COALESCE($4, subject_id),
         class_id = COALESCE($5, class_id),
         is_public = COALESCE($6, is_public),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.description, data.subjectId, data.classId, data.isPublic]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM forums WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async incrementMemberCount(id, delta) {
    await query('UPDATE forums SET member_count = GREATEST(0, member_count + $2) WHERE id = $1', [id, delta]);
  },

  async incrementPostCount(id, delta) {
    await query('UPDATE forums SET post_count = GREATEST(0, post_count + $2) WHERE id = $1', [id, delta]);
  },
};

export default forumModel;