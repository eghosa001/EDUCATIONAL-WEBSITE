import { query } from '../../common/database/index.js';

export const pastQuestionFileModel = {
  async findById(id) {
    const result = await query(
      `SELECT * FROM past_question_files WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async list(params = {}) {
    const {
      page = 1, limit = 50, board, subject, year, isProcessed, search,
    } = params;

    const conditions = [];
    const values = [];

    if (board) {
      conditions.push(`board = $${values.length + 1}`);
      values.push(board);
    }
    if (subject) {
      conditions.push(`subject ILIKE $${values.length + 1}`);
      values.push(`%${subject}%`);
    }
    if (year) {
      conditions.push(`year = $${values.length + 1}`);
      values.push(year);
    }
    if (isProcessed !== undefined) {
      conditions.push(`is_processed = $${values.length + 1}`);
      values.push(isProcessed);
    }
    if (search) {
      conditions.push(`(file_name ILIKE $${values.length + 1} OR subject ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM past_question_files ${whereClause}
       ORDER BY board, subject, year DESC NULLS LAST, file_name
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM past_question_files ${whereClause}`,
      values.slice(0, -2)
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

  async listByBoard(board, params = {}) {
    const { page = 1, limit = 50, subject, year } = params;
    const conditions = ['board = $1'];
    const values = [board];
    let paramIndex = 2;

    if (subject) {
      conditions.push(`subject ILIKE $${paramIndex++}`);
      values.push(`%${subject}%`);
    }
    if (year) {
      conditions.push(`year = $${paramIndex++}`);
      values.push(year);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM past_question_files ${whereClause}
       ORDER BY subject, year DESC NULLS LAST, file_name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM past_question_files ${whereClause}`,
      values.slice(0, -2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: countResult.rows[0].total, totalPages: Math.ceil(countResult.rows[0].total / limit) },
    };
  },

  async getSubjectsByBoard(board) {
    const result = await query(
      `SELECT subject, COUNT(*) as file_count, 
              SUM(file_size)/1024/1024 as total_mb,
              MIN(year) as min_year, MAX(year) as max_year,
              BOOL_AND(is_processed) as all_processed
       FROM past_question_files
       WHERE board = $1
       GROUP BY subject
       ORDER BY file_count DESC`,
      [board]
    );
    return result.rows;
  },

  async getYearsByBoard(board) {
    const result = await query(
      `SELECT DISTINCT year FROM past_question_files
       WHERE board = $1 AND year IS NOT NULL
       ORDER BY year DESC`,
      [board]
    );
    return result.rows.map(r => r.year);
  },

  async getBoards() {
    const result = await query(
      `SELECT board, COUNT(*) as file_count,
              COUNT(DISTINCT subject) as subject_count,
              SUM(file_size)/1024/1024 as total_mb
       FROM past_question_files
       GROUP BY board
       ORDER BY board`
    );
    return result.rows;
  },

  async getStats() {
    const result = await query(
      `SELECT
         COUNT(*)::int as total_files,
         COUNT(DISTINCT board)::int as boards,
         COUNT(DISTINCT subject)::int as subjects,
         SUM(file_size)/1024/1024 as total_mb,
         COUNT(*) FILTER (WHERE is_processed)::int as processed_files,
         SUM(questions_extracted)::int as total_questions_extracted
       FROM past_question_files`
    );
    return result.rows[0];
  },

  async markProcessed(id, questionsExtracted) {
    const result = await query(
      `UPDATE past_question_files
       SET is_processed = TRUE, questions_extracted = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, questionsExtracted]
    );
    return result.rows[0] || null;
  },
};

export default pastQuestionFileModel;
