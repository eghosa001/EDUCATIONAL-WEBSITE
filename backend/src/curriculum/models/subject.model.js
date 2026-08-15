import { query } from '../../common/database/index.js';

export const subjectModel = {
  async findById(id) {
    const result = await query('SELECT * FROM subjects WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCode(educationSystemId, code) {
    const result = await query(
      'SELECT * FROM subjects WHERE education_system_id = $1 AND code = $2',
      [educationSystemId, code]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const { educationSystemId, name, code, description, icon, color, orderIndex, isCore } = data;
    const result = await query(
      `INSERT INTO subjects (education_system_id, name, code, description, icon, color, order_index, is_core)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [educationSystemId, name, code, description, icon, color, orderIndex, isCore]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE subjects SET
         name = COALESCE($2, name),
         code = COALESCE($3, code),
         description = COALESCE($4, description),
         icon = COALESCE($5, icon),
         color = COALESCE($6, color),
         order_index = COALESCE($7, order_index),
         is_core = COALESCE($8, is_core),
         is_active = COALESCE($9, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.code, data.description, data.icon, data.color, data.orderIndex, data.isCore, data.isActive]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, educationSystemId, classId, levelCode } = {}) {
    const conditions = [];
    const values = [];
    let joins = '';

    if (educationSystemId) {
      conditions.push(`education_system_id = $${values.length + 1}`);
      values.push(educationSystemId);
    }

    if (classId) {
      conditions.push(`EXISTS (SELECT 1 FROM class_subjects cs WHERE cs.subject_id = subjects.id AND cs.class_id = $${values.length + 1})`);
      values.push(classId);
    }

    if (levelCode) {
      joins = `
        JOIN topics ON topics.subject_id = subjects.id
        JOIN classes ON classes.id = topics.class_id
        JOIN programs ON programs.id = classes.program_id
        JOIN education_levels ON education_levels.id = programs.education_level_id`;
      conditions.push(`education_levels.code = $${values.length + 1}`);
      values.push(levelCode);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT DISTINCT subjects.* FROM subjects ${joins} ${whereClause} ORDER BY subjects.name LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default subjectModel;
