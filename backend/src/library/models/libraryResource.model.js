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
      `SELECT id, title, resource_type, file_url, file_size_bytes,
           mime_type, description, subject_id, class_id,
           exam_board, exam_year, is_free, tags,
           download_count, view_count
      FROM library_resources
      ${whereClause}
      ORDER BY created_at DESC LIMIT $${paramIndex - 1} OFFSET $${paramIndex}
      `,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM library_resources ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async findById(id) {
    const result = await query('SELECT * FROM library_resources WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT * FROM library_resources WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { title, resourceType, fileUrl, fileSizeBytes, mimeType, description, isDownloadable, subjectId, classId, examBoard, examYear, isFree, tags } = data;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      `INSERT INTO library_resources (title, slug, resource_type, file_url, file_size_bytes, mime_type, description, subject_id, class_id, exam_board, exam_year, is_free, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [title, slug, resourceType, fileUrl, fileSizeBytes, mimeType, description, subjectId, classId, examBoard, examYear, isFree, JSON.stringify(tags || [])]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { title, resourceType, fileUrl, fileSizeBytes, mimeType, description, subjectId, classId, examBoard, examYear, isFree, tags } = data;
    const slug = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null;
    const result = await query(
      `UPDATE library_resources SET
         title = COALESCE($2, title),
         slug = COALESCE($3, slug),
         resource_type = COALESCE($4, resource_type),
         file_url = COALESCE($5, file_url),
         file_size_bytes = COALESCE($6, file_size_bytes),
         mime_type = COALESCE($7, mime_type),
         description = COALESCE($8, description),
         subject_id = COALESCE($9, subject_id),
         class_id = COALESCE($10, class_id),
         exam_board = COALESCE($11, exam_board),
         exam_year = COALESCE($12, exam_year),
         is_free = COALESCE($13, is_free),
         tags = COALESCE($14, tags),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, title, slug, resourceType, fileUrl, fileSizeBytes, mimeType, description, subjectId, classId, examBoard, examYear, isFree, tags ? JSON.stringify(tags) : null]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM library_resources WHERE id = $1 RETURNING id', [id]);
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
      `SELECT * FROM library_resources WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
      values
    );
    return result.rows;
  },
};

export default libraryResourceModel;