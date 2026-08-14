import { query } from '../../common/database/index.js';

export const questionModel = {
  async findById(id) {
    const result = await query('SELECT * FROM questions WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      subjectId, topicId, subtopicId, classId, questionType, questionText,
      questionImageUrl, options, correctAnswer, explanation, explanationImageUrl,
      difficulty, marks, negativeMarks, timeLimitSeconds, source, examYear,
      examName, tags, createdBy,
    } = data;
    const result = await query(
      `INSERT INTO questions (
         subject_id, topic_id, subtopic_id, class_id, question_type, question_text,
         question_image_url, options, correct_answer, explanation, explanation_image_url,
         difficulty, marks, negative_marks, time_limit_seconds, source, exam_year,
         exam_name, tags, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        subjectId, topicId, subtopicId, classId, questionType, questionText,
        questionImageUrl, JSON.stringify(options), JSON.stringify(correctAnswer), explanation, explanationImageUrl,
        difficulty, marks, negativeMarks, timeLimitSeconds, source, examYear,
        examName, JSON.stringify(tags), createdBy,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE questions SET
         question_text = COALESCE($2, question_text),
         question_image_url = COALESCE($3, question_image_url),
         options = COALESCE($4, options),
         correct_answer = COALESCE($5, correct_answer),
         explanation = COALESCE($6, explanation),
         difficulty = COALESCE($7, difficulty),
         marks = COALESCE($8, marks),
         is_active = COALESCE($9, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.questionText, data.questionImageUrl, data.options ? JSON.stringify(data.options) : null, data.correctAnswer !== undefined ? JSON.stringify(data.correctAnswer) : null, data.explanation, data.difficulty, data.marks, data.isActive]
    );
    return result.rows[0] || null;
  },

  async review(id, reviewerId) {
    const result = await query(
      `UPDATE questions SET reviewed_by = $2, reviewed_at = NOW() WHERE id = $1 RETURNING *`,
      [id, reviewerId]
    );
    return result.rows[0] || null;
  },

  async incrementUsage(id) {
    await query('UPDATE questions SET usage_count = usage_count + 1 WHERE id = $1', [id]);
  },

  async list({ page = 1, limit = 20, subjectId, topicId, classId, difficulty, questionType, examName, examYear, search } = {}) {
    const conditions = [];
    const values = [];

    if (subjectId) {
      conditions.push(`subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (topicId) {
      conditions.push(`topic_id = $${values.length + 1}`);
      values.push(topicId);
    }
    if (classId) {
      conditions.push(`class_id = $${values.length + 1}`);
      values.push(classId);
    }
    if (difficulty) {
      conditions.push(`difficulty = $${values.length + 1}`);
      values.push(difficulty);
    }
    if (questionType) {
      conditions.push(`question_type = $${values.length + 1}`);
      values.push(questionType);
    }
    if (examName) {
      conditions.push(`exam_name = $${values.length + 1}`);
      values.push(examName);
    }
    if (examYear) {
      conditions.push(`exam_year = $${values.length + 1}`);
      values.push(examYear);
    }
    if (search) {
      conditions.push(`question_text ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM questions ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM questions ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async delete(id) {
    const result = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default questionModel;
