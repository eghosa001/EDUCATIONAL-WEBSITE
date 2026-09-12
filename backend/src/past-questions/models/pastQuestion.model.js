import { query, transaction } from '../../common/database/index.js';

export const pastQuestionModel = {
  async findById(id) {
    const result = await query(
      `SELECT pq.*, s.name as subject_name, s.code as subject_code,
              t.name as topic_name
       FROM past_questions pq
       LEFT JOIN subjects s ON pq.subject_id = s.id
       LEFT JOIN topics t ON pq.topic_id = t.id
       WHERE pq.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      board, year, subjectId, topicId, questionType, questionText,
      questionImageUrl, options, correctAnswer, explanation, difficulty,
      marks, source, tags, createdBy,
    } = data;
    const result = await query(
      `INSERT INTO past_questions (
          board, year, subject_id, topic_id, question_type, question_text,
          question_image_url, options, correct_answer, explanation, difficulty,
          marks, source, tags, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
      [board, year, subjectId, topicId, questionType, questionText, questionImageUrl,
       JSON.stringify(options), JSON.stringify(correctAnswer), explanation, difficulty,
       marks, source, JSON.stringify(tags), createdBy]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE past_questions SET
          question_text = COALESCE($2, question_text),
          options = COALESCE($3, options),
          correct_answer = COALESCE($4, correct_answer),
          explanation = COALESCE($5, explanation),
          difficulty = COALESCE($6, difficulty),
          is_active = COALESCE($7, is_active)
        WHERE id = $1 RETURNING *`,
      [id, data.questionText,
       data.options ? JSON.stringify(data.options) : null,
       data.correctAnswer !== undefined ? JSON.stringify(data.correctAnswer) : null,
       data.explanation, data.difficulty, data.isActive]
    );
    return result.rows[0] || null;
  },

  async list(params = {}) {
    const {
      page = 1, limit = 20, board, year, subjectId, topicId,
      questionType, difficulty, search, isActive,
    } = params;
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const conditions = [];
    const values = [];
    const add = (sql, value) => { conditions.push(`${sql} $${values.length + 1}`); values.push(value); };

    if (board) add('pq.board =', board);
    if (year) add('pq.year =', year);
    if (subjectId) add('pq.subject_id =', subjectId);
    if (topicId) add('pq.topic_id =', topicId);
    if (questionType) add('pq.question_type =', questionType);
    if (difficulty) add('pq.difficulty =', difficulty);
    if (isActive !== undefined) add('pq.is_active =', isActive);
    if (search) add('pq.question_text ILIKE', `%${search}%`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM past_questions pq ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.total || 0);
    const offset = (safePage - 1) * safeLimit;
    const pageValues = [...values, safeLimit, offset];

    const result = await query(
      `SELECT pq.*, s.name as subject_name, s.code as subject_code, t.name as topic_name
       FROM past_questions pq
       LEFT JOIN subjects s ON pq.subject_id = s.id
       LEFT JOIN topics t ON pq.topic_id = t.id
       ${whereClause}
       ORDER BY pq.year DESC, pq.created_at DESC
       LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
      pageValues
    );

    return { data: result.rows, pagination: { page: safePage, limit: safeLimit, total, totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit) } };
  },

  async listByBoard(board, params = {}) {
    const { page = 1, limit = 20, subjectId, year, isActive } = params;
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const conditions = ['pq.board = $1'];
    const values = [board];
    if (subjectId) { conditions.push(`pq.subject_id = $${values.length + 1}`); values.push(subjectId); }
    if (year) { conditions.push(`pq.year = $${values.length + 1}`); values.push(year); }
    if (isActive !== undefined) { conditions.push(`pq.is_active = $${values.length + 1}`); values.push(isActive); }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM past_questions pq ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.total || 0);
    const offset = (safePage - 1) * safeLimit;
    const pageValues = [...values, safeLimit, offset];
    const result = await query(
      `SELECT pq.*, s.name as subject_name, s.code as subject_code, t.name as topic_name
       FROM past_questions pq
       LEFT JOIN subjects s ON pq.subject_id = s.id
       LEFT JOIN topics t ON pq.topic_id = t.id
       ${whereClause}
       ORDER BY pq.year DESC, pq.created_at DESC
       LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
      pageValues
    );
    return { data: result.rows, pagination: { page: safePage, limit: safeLimit, total, totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit) } };
  },

  async listBySubject(subjectId, params = {}) {
    const { page = 1, limit = 20, board, year, isActive } = params;
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const conditions = ['pq.subject_id = $1'];
    const values = [subjectId];
    if (board) { conditions.push(`pq.board = $${values.length + 1}`); values.push(board); }
    if (year) { conditions.push(`pq.year = $${values.length + 1}`); values.push(year); }
    if (isActive !== undefined) { conditions.push(`pq.is_active = $${values.length + 1}`); values.push(isActive); }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM past_questions pq ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.total || 0);
    const offset = (safePage - 1) * safeLimit;
    const pageValues = [...values, safeLimit, offset];
    const result = await query(
      `SELECT pq.*, s.name as subject_name, s.code as subject_code, t.name as topic_name
       FROM past_questions pq
       LEFT JOIN subjects s ON pq.subject_id = s.id
       LEFT JOIN topics t ON pq.topic_id = t.id
       ${whereClause}
       ORDER BY pq.year DESC, pq.created_at DESC
       LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
      pageValues
    );
    return { data: result.rows, pagination: { page: safePage, limit: safeLimit, total, totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit) } };
  },

  async getTopicsByBoard(board) {
    const result = await query(
      `SELECT t.id, t.name, COUNT(pq.id)::int as question_count
       FROM topics t
       JOIN past_questions pq ON t.id = pq.topic_id
       WHERE pq.board = $1 AND pq.is_active = TRUE
       GROUP BY t.id, t.name
       ORDER BY question_count DESC`,
      [board]
    );
    return result.rows;
  },

  async getYearsByBoard(board) {
    const result = await query(
      `SELECT DISTINCT year FROM past_questions WHERE board = $1 AND is_active = TRUE ORDER BY year DESC`,
      [board]
    );
    return result.rows.map(r => Number.parseInt(r.year, 10));
  },

  async incrementUsage(id) {
    await query('UPDATE past_questions SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = $1', [id]);
  },

  async bulkImport(dataList) {
    return transaction(async (client) => {
      const results = [];
      for (const data of dataList) {
        const result = await client.query(
          `INSERT INTO past_questions (
              board, year, subject_id, topic_id, question_type, question_text,
              question_image_url, options, correct_answer, explanation, difficulty,
              marks, source, tags, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
          [data.board, data.year, data.subjectId, data.topicId, data.questionType, data.questionText,
           data.questionImageUrl, JSON.stringify(data.options), JSON.stringify(data.correctAnswer),
           data.explanation, data.difficulty, data.marks, data.source, JSON.stringify(data.tags), data.createdBy]
        );
        results.push(result.rows[0]);
      }
      return results;
    });
  },

  async getAnalytics(board, subjectId) {
    const result = await query(
      `SELECT COUNT(*)::int as total_questions,
              COUNT(DISTINCT year)::int as years_covered,
              AVG(marks)::numeric(5,2) as avg_marks,
              jsonb_agg(DISTINCT year) as years
       FROM past_questions
       WHERE board = $1 AND is_active = TRUE ${subjectId ? 'AND subject_id = $2' : ''}`,
      subjectId ? [board, subjectId] : [board]
    );
    return result.rows[0];
  },
};

export default pastQuestionModel;
