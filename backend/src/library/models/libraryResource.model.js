import { query } from '../../common/database/index.js';

export const libraryResourceModel = {
  async list(params = {}) {
    const { page = 1, limit = 20, resourceType, search, subjectId, classId, examBoard, isFree } = params;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      values.push(resourceType);
    }
    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (subjectId) {
      conditions.push(`subject_id = $${paramIndex++}`);
      values.push(subjectId);
    }
    if (classId) {
      conditions.push(`class_id = $${paramIndex++}`);
      values.push(classId);
    }
    if (examBoard) {
      conditions.push(`exam_board = $${paramIndex++}`);
      values.push(examBoard);
    }
    if (isFree !== undefined) {
      conditions.push(`is_free = $${paramIndex++}`);
      values.push(isFree);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await query(
      `SELECT lr.id, lr.title, lr.resource_type, lr.file_url, lr.file_size_bytes,
           lr.mime_type, lr.description, lr.is_downloadable,
           l.id AS lesson_id, l.title AS lesson_title,
           c.id AS course_id, c.title AS course_title,
           c.subject_id, c.class_id
      FROM lesson_resources lr
      JOIN lessons l ON l.id = lr.lesson_id
      JOIN courses c ON c.id = l.course_id
      ${whereClause}
      ORDER BY lr.created_at DESC LIMIT $${paramIndex - 1} OFFSET $${paramIndex}
      `,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM lesson_resources lr JOIN lessons l ON l.id = lr.lesson_id JOIN courses c ON c.id = l.course_id ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async findById(id) {
    const result = await query('SELECT lr.*, l.title AS lesson_title, c.title AS course_title FROM lesson_resources lr JOIN lessons l ON l.id = lr.lesson_id JOIN courses c ON c.id = l.course_id WHERE lr.id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT lr.*, l.title AS lesson_title, c.title AS course_title FROM lesson_resources lr JOIN lessons l ON l.id = lr.lesson_id JOIN courses c ON c.id = l.course_id WHERE lr.slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { title, resourceType, fileUrl, fileSizeBytes, mimeType, description, isDownloadable, lessonId, subjectId, classId, examBoard, examYear, isFree, tags } = data;
    const result = await query(
      `INSERT INTO lesson_resources (title, resource_type, file_url, file_size_bytes, mime_type, description, is_downloadable, lesson_id, subject_id, class_id, exam_board, exam_year, is_free, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [title, resourceType, fileUrl, fileSizeBytes, mimeType, description, isDownloadable, lessonId, subjectId, classId, examBoard, examYear, isFree, JSON.stringify(tags || [])]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { title, resourceType, fileUrl, fileSizeBytes, mimeType, description, isDownloadable, lessonId, subjectId, classId, examBoard, examYear, isFree, tags } = data;
    const result = await query(
      `UPDATE lesson_resources SET
         title = COALESCE($2, title),
         resource_type = COALESCE($3, resource_type),
         file_url = COALESCE($4, file_url),
         file_size_bytes = COALESCE($5, file_size_bytes),
         mime_type = COALESCE($6, mime_type),
         description = COALESCE($7, description),
         is_downloadable = COALESCE($8, is_downloadable),
         lesson_id = COALESCE($9, lesson_id),
         subject_id = COALESCE($10, subject_id),
         class_id = COALESCE($11, class_id),
         exam_board = COALESCE($12, exam_board),
         exam_year = COALESCE($13, exam_year),
         is_free = COALESCE($14, is_free),
         tags = COALESCE($15, tags)
       WHERE id = $1 RETURNING *`,
      [id, title, resourceType, fileUrl, fileSizeBytes, mimeType, description, isDownloadable, lessonId, subjectId, classId, examBoard, examYear, isFree, tags ? JSON.stringify(tags) : null]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM lesson_resources WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async search(queryText, filters = {}) {
    const conditions = ["(title ILIKE $1 OR description ILIKE $1)"];
    const values = [`%${queryText}%`];
    let paramIndex = 2;

    if (filters.resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      values.push(filters.resourceType);
    }
    if (filters.subjectId) {
      conditions.push(`subject_id = $${paramIndex++}`);
      values.push(filters.subjectId);
    }
    if (filters.classId) {
      conditions.push(`class_id = $${paramIndex++}`);
      values.push(filters.classId);
    }
    if (filters.examBoard) {
      conditions.push(`exam_board = $${paramIndex++}`);
      values.push(filters.examBoard);
    }
    if (filters.isFree !== undefined) {
      conditions.push(`is_free = $${paramIndex++}`);
      values.push(filters.isFree);
    }

    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT * FROM lesson_resources WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
      values
    );
    return result.rows;
  },
};

export default libraryResourceModel;