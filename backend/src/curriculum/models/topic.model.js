import { query } from '../../common/database/index.js';

export const topicModel = {
  async findById(id) {
    const result = await query('SELECT * FROM topics WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { subjectId, classId, termId, name, code, description, learningObjectives, orderIndex, estimatedHours } = data;
    const result = await query(
      `INSERT INTO topics (subject_id, class_id, term_id, name, code, description, learning_objectives, order_index, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [subjectId, classId, termId, name, code, description, learningObjectives, orderIndex, estimatedHours]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE topics SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         learning_objectives = COALESCE($4, learning_objectives),
         order_index = COALESCE($5, order_index),
         estimated_hours = COALESCE($6, estimated_hours),
         is_active = COALESCE($7, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.description, data.learningObjectives, data.orderIndex, data.estimatedHours, data.isActive]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, subjectId, classId, termId, levelCode } = {}) {
    const conditions = [];
    const values = [];
    let joins = '';

    if (subjectId) {
      conditions.push(`topic.subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (classId) {
      conditions.push(`topic.class_id = $${values.length + 1}`);
      values.push(classId);
    }
    if (termId) {
      conditions.push(`topic.term_id = $${values.length + 1}`);
      values.push(termId);
    }
    if (levelCode) {
      joins = `
        JOIN classes ON classes.id = topic.class_id
        JOIN programs ON programs.id = classes.program_id
        JOIN education_levels ON education_levels.id = programs.education_level_id`;
      conditions.push(`education_levels.code = $${values.length + 1}`);
      values.push(levelCode);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT topic.*, terms.name AS term_name
       FROM topics topic
       JOIN terms ON terms.id = topic.term_id
       ${joins} ${whereClause} ORDER BY topic.order_index LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM topics WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default topicModel;
