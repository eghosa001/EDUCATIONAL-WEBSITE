import { query, getClient, transaction } from '../../common/database/index.js';
import { AppError } from '../../common/errors/index.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

const EXAM_BOARDS = ['jamb', 'waec', 'neco', 'nabteb', 'post-utme', 'university', 'professional', 'custom'];

export const pastQuestionModel = {
  async findById(id) {
    const result = await query('SELECT * FROM past_questions WHERE id = $1', [id]);
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
      [id, data.questionText, data.options ? JSON.stringify(data.options) : null,
       data.correctAnswer !== undefined ? JSON.stringify(data.correctAnswer) : null,
       data.explanation, data.difficulty, data.isActive]
    );
    return result.rows[0] || null;
  },

  async list(params = {}) {
    const {
      page = 1, limit = 20, board, year, subjectId, topicId,
      questionType, difficulty, search,
    } = params;

    const conditions = [];
    const values = [];

    if (board) {
      conditions.push(`board = $${values.length + 1}`);
      values.push(board);
    }
    if (year) {
      conditions.push(`year = $${values.length + 1}`);
      values.push(year);
    }
    if (subjectId) {
      conditions.push(`subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (topicId) {
      conditions.push(`topic_id = $${values.length + 1}`);
      values.push(topicId);
    }
    if (questionType) {
      conditions.push(`question_type = $${values.length + 1}`);
      values.push(questionType);
    }
    if (difficulty) {
      conditions.push(`difficulty = $${values.length + 1}`);
      values.push(difficulty);
    }
    if (search) {
      conditions.push(`question_text ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT pq.*, s.name as subject_name, t.name as topic_name
       FROM past_questions pq
       LEFT JOIN subjects s ON pq.subject_id = s.id
       LEFT JOIN topics t ON pq.topic_id = t.id
       ${whereClause}
       ORDER BY pq.year DESC, pq.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM past_questions ${whereClause}`,
      values.slice(0, -2)
    );

    return {
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
    };
  },

  async listByBoard(board, params = {}) {
    const { page = 1, limit = 20, subjectId, year } = params;
    const conditions = [`board = $1`];
    const values = [board];
    let paramIndex = 2;

    if (subjectId) {
      conditions.push(`subject_id = $${paramIndex++}`);
      values.push(subjectId);
    }
    if (year) {
      conditions.push(`year = $${paramIndex++}`);
      values.push(year);
    }

    const whereClause = conditions.length > 1 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM past_questions ${whereClause} ORDER BY year DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM past_questions ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async listBySubject(subjectId, params = {}) {
    const { page = 1, limit = 20, board, year } = params;
    const conditions = [`subject_id = $1`];
    const values = [subjectId];
    let paramIndex = 2;

    if (board) {
      conditions.push(`board = $${paramIndex++}`);
      values.push(board);
    }
    if (year) {
      conditions.push(`year = $${paramIndex++}`);
      values.push(year);
    }

    const whereClause = conditions.length > 1 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM past_questions ${whereClause} ORDER BY year DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM past_questions ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async getTopicsByBoard(board) {
    const result = await query(
      `SELECT DISTINCT t.id, t.name, COUNT(pq.id) as question_count
       FROM topics t
       JOIN past_questions pq ON t.id = pq.topic_id
       WHERE pq.board = $1
       GROUP BY t.id, t.name
       ORDER BY question_count DESC`,
      [board]
    );
    return result.rows;
  },

  async getYearsByBoard(board) {
    const result = await query(
      `SELECT DISTINCT year FROM past_questions WHERE board = $1 ORDER BY year DESC`,
      [board]
    );
    return result.rows.map(r => parseInt(r.year));
  },

  async incrementUsage(id) {
    await query('UPDATE past_questions SET usage_count = usage_count + 1 WHERE id = $1', [id]);
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
};

export const pastQuestionService = {
  async getBoards() {
    return EXAM_BOARDS;
  },

  async getBoardStats(board) {
    const result = await query(
      `SELECT COUNT(*)::int as total, COUNT(DISTINCT year)::int as years,
              COUNT(DISTINCT subject_id)::int as subjects,
              COUNT(DISTINCT topic_id)::int as topics
       FROM past_questions WHERE board = $1`,
      [board]
    );
    return result.rows[0];
  },

  async getQuestionsForPractice(board, subjectId, topicId, count = 20) {
    const conditions = ['board = $1'];
    const values = [board];
    let paramIndex = 2;

    if (subjectId) {
      conditions.push(`subject_id = $${paramIndex++}`);
      values.push(subjectId);
    }
    if (topicId) {
      conditions.push(`topic_id = $${paramIndex++}`);
      values.push(topicId);
    }

    const whereClause = conditions.join(' AND ');
    values.push(count);

    const result = await query(
      `SELECT * FROM past_questions WHERE ${whereClause} ORDER BY RANDOM() LIMIT $${paramIndex}`,
      values
    );
    return result.rows;
  },

  async generateTimedTest(board, subjectId, count = 40) {
    const questions = await this.getQuestionsForPractice(board, subjectId, null, count);
    return {
      questions: questions.map(q => ({
        id: q.id,
        text: q.questionText,
        options: q.options,
        type: q.questionType,
      })),
      durationMinutes: Math.ceil(count * 1.5),
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    };
  },

  async getAnalytics(board, subjectId) {
    const result = await query(
      `SELECT
         COUNT(*)::int as total_questions,
         COUNT(DISTINCT year)::int as years_covered,
         AVG(marks)::numeric(5,2) as avg_marks,
         jsonb_agg(DISTINCT year) as years
       FROM past_questions
       WHERE board = $1 ${subjectId ? 'AND subject_id = $2' : ''}`,
      subjectId ? [board, subjectId] : [board]
    );
    return result.rows[0];
  },
};

export default pastQuestionService;
