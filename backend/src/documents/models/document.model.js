import { query } from '../../common/database/index.js';

export const documentModel = {
  async findById(id) {
    const result = await query('SELECT * FROM documents WHERE id = $1 AND is_active = TRUE', [id]);
    return result.rows[0] || null;
  },

  async list(params = {}) {
    const {
      page = 1, limit = 20, bucket, category, examBoard,
      examYear, subject, educationLevel, isFree, search,
    } = params;

    const conditions = ['is_active = TRUE'];
    const values = [];

    if (bucket) {
      conditions.push(`bucket = $${values.length + 1}`);
      values.push(bucket);
    }
    if (category) {
      conditions.push(`category = $${values.length + 1}`);
      values.push(category);
    }
    if (examBoard) {
      conditions.push(`exam_board = $${values.length + 1}`);
      values.push(examBoard);
    }
    if (examYear) {
      conditions.push(`exam_year = $${values.length + 1}`);
      values.push(examYear);
    }
    if (subject) {
      conditions.push(`subject ILIKE $${values.length + 1}`);
      values.push(`%${subject}%`);
    }
    if (educationLevel) {
      conditions.push(`education_level = $${values.length + 1}`);
      values.push(educationLevel);
    }
    if (isFree !== undefined) {
      conditions.push(`is_free = $${values.length + 1}`);
      values.push(isFree);
    }
    if (search) {
      conditions.push(`(title ILIKE $${values.length + 1} OR file_name ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT id, title, description, file_name, file_url, file_size_bytes, mime_type,
              bucket, category, exam_board, exam_year, subject, education_level,
              tags, download_count, view_count, is_free, created_at
       FROM documents
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM documents ${whereClause}`,
      values.slice(0, values.length - 2)
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

  async getBuckets() {
    const result = await query(
      `SELECT bucket, category, COUNT(*)::int as document_count,
              SUM(file_size_bytes)::bigint as total_size
       FROM documents
       WHERE is_active = TRUE
       GROUP BY bucket, category
       ORDER BY bucket`
    );
    return result.rows;
  },

  async getSubjects(bucket) {
    const result = await query(
      `SELECT DISTINCT subject, COUNT(*)::int as document_count
       FROM documents
       WHERE is_active = TRUE AND subject IS NOT NULL
       ${bucket ? 'AND bucket = $1' : ''}
       GROUP BY subject
       ORDER BY subject`,
      bucket ? [bucket] : []
    );
    return result.rows;
  },

  async getYears(bucket) {
    const result = await query(
      `SELECT DISTINCT exam_year, COUNT(*)::int as document_count
       FROM documents
       WHERE is_active = TRUE AND exam_year IS NOT NULL
       ${bucket ? 'AND bucket = $1' : ''}
       GROUP BY exam_year
       ORDER BY exam_year DESC`,
      bucket ? [bucket] : []
    );
    return result.rows;
  },

  async incrementDownload(id) {
    await query('UPDATE documents SET download_count = download_count + 1 WHERE id = $1', [id]);
  },

  async incrementView(id) {
    await query('UPDATE documents SET view_count = view_count + 1 WHERE id = $1', [id]);
  },
};

export default documentModel;
