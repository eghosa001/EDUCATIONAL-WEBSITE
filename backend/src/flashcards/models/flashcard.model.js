import { query } from '../../common/database/index.js';

export const flashcardModel = {
  async findById(id) {
    const result = await query('SELECT * FROM flashcards WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { front, back, courseId, subjectId, topicId, userId, tags, difficulty } = data;
    const result = await query(
      `INSERT INTO flashcards (front, back, course_id, subject_id, topic_id, created_by, tags, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [front, back, courseId, subjectId, topicId, userId, JSON.stringify(tags || []), difficulty || 'medium']
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE flashcards SET
         front = COALESCE($2, front),
         back = COALESCE($3, back),
         difficulty = COALESCE($4, difficulty),
         tags = COALESCE($5, tags)
       WHERE id = $1 RETURNING *`,
      [id, data.front, data.back, data.difficulty, data.tags ? JSON.stringify(data.tags) : null]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM flashcards WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async listByCourse(courseId, params = {}) {
    const { page = 1, limit = 20, difficulty } = params;
    const conditions = ['course_id = $1'];
    const values = [courseId];
    let paramIndex = 2;

    if (difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      values.push(difficulty);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM flashcards ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM flashcards ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async listByUser(userId, params = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT f.*, fr.next_review_date, fr.repetition_level, fr.ease_factor
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id AND fr.user_id = $1
       WHERE f.created_by = $1
       ORDER BY f.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findByCourse(courseId) {
    const result = await query('SELECT * FROM flashcards WHERE course_id = $1 ORDER BY created_at ASC', [courseId]);
    return result.rows;
  },
};

export default flashcardModel;