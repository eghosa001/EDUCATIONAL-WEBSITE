import { query } from '../../common/database/index.js';

export const subtopicModel = {
  async findById(id) {
    const result = await query('SELECT * FROM subtopics WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { topicId, name, code, description, learningObjectives, orderIndex, estimatedHours } = data;
    const result = await query(
      `INSERT INTO subtopics (topic_id, name, code, description, learning_objectives, order_index, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [topicId, name, code, description, learningObjectives, orderIndex, estimatedHours]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE subtopics SET
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

  async listByTopic(topicId) {
    const result = await query(
      'SELECT * FROM subtopics WHERE topic_id = $1 ORDER BY order_index',
      [topicId]
    );
    return result.rows;
  },

  async delete(id) {
    const result = await query('DELETE FROM subtopics WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default subtopicModel;
