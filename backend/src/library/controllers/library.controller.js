import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listLibrary = async (req, res) => {
  const { page, limit, resourceType, search } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];

  if (resourceType) {
    values.push(resourceType);
    conditions.push(`resource_type = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM library_resources
     ${whereClause}`,
    values
  );

  const result = await query(
    `SELECT id, title, slug, resource_type, file_url, file_size_bytes,
            mime_type, description, subject_id, class_id,
            exam_board, exam_year, is_free, tags,
            download_count, view_count
     FROM library_resources
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const total = countResult.rows[0].total;

  res.json({
    success: true,
    data: {
      resources: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
};

export const getLibraryStats = async (req, res) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM library_resources) AS total_resources,
       (SELECT COUNT(*)::int FROM documents WHERE category = 'past_question') AS past_question_documents,
       (SELECT COUNT(*)::int FROM documents WHERE category = 'curriculum_document') AS curriculum_documents,
       (SELECT COUNT(*)::int FROM subjects WHERE is_active = TRUE) AS total_subjects,
       (SELECT COUNT(*)::int FROM courses WHERE status = 'published') AS published_courses`
  );

  res.json({ success: true, data: { stats: result.rows[0] } });
};

export const listPastQuestions = async (req, res) => {
  const { page, limit, subjectId, examBoard, examYear } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];

  if (subjectId) {
    values.push(subjectId);
    conditions.push(`subject_id = $${values.length}`);
  }
  if (examBoard) {
    values.push(examBoard);
    conditions.push(`exam_board = $${values.length}`);
  }
  if (examYear) {
    values.push(examYear);
    conditions.push(`exam_year = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM library_resources ${whereClause}`,
    values
  );

  const result = await query(
    `SELECT id, title, slug, resource_type, file_url, file_size_bytes,
            mime_type, description, subject_id, class_id,
            exam_board, exam_year, is_free, tags,
            download_count, view_count
     FROM library_resources
     ${whereClause}
     ORDER BY exam_year DESC, created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const total = countResult.rows[0].total;

  res.json({
    success: true,
    data: {
      questions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
};

export const getPastQuestionExams = async (req, res) => {
  const result = await query(
    `SELECT exam_board AS name,
            COUNT(*)::int AS question_count,
            array_agg(DISTINCT exam_year) AS years
     FROM library_resources
     WHERE exam_board IS NOT NULL
     GROUP BY exam_board
     ORDER BY name`
  );

  res.json({ success: true, data: { exams: result.rows } });
};

export const getLibraryResource = async (req, res) => {
  const result = await query(
    `SELECT * FROM library_resources WHERE id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) notFound('Resource');

  res.json({ success: true, data: { resource: result.rows[0] } });
};
