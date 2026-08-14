import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listLibrary = async (req, res) => {
  const { page, limit, resourceType, search } = req.query;
  const offset = (page - 1) * limit;

  const conditions = ['lr.is_downloadable = TRUE'];
  const values = [];

  if (resourceType) {
    values.push(resourceType);
    conditions.push(`lr.resource_type = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(lr.title ILIKE $${values.length} OR l.title ILIKE $${values.length} OR c.title ILIKE $${values.length})`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM lesson_resources lr
     JOIN lessons l ON l.id = lr.lesson_id
     JOIN courses c ON c.id = l.course_id
     ${whereClause}`,
    values
  );

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
     ORDER BY lr.created_at DESC
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
       (SELECT COUNT(*)::int FROM lesson_resources WHERE is_downloadable = TRUE) AS total_resources,
       (SELECT COUNT(*)::int FROM questions WHERE source IS NOT NULL OR exam_name IS NOT NULL) AS past_questions,
       (SELECT COUNT(*)::int FROM subjects WHERE is_active = TRUE) AS total_subjects,
       (SELECT COUNT(*)::int FROM courses WHERE status = 'published') AS published_courses`
  );

  res.json({ success: true, data: { stats: result.rows[0] } });
};

export const listPastQuestions = async (req, res) => {
  const { page, limit, subjectId, classId, examName, examYear } = req.query;
  const offset = (page - 1) * limit;

  const conditions = ['(source IS NOT NULL OR exam_name IS NOT NULL)'];
  const values = [];

  if (subjectId) {
    values.push(subjectId);
    conditions.push(`subject_id = $${values.length}`);
  }
  if (classId) {
    values.push(classId);
    conditions.push(`class_id = $${values.length}`);
  }
  if (examName) {
    values.push(examName);
    conditions.push(`exam_name = $${values.length}`);
  }
  if (examYear) {
    values.push(examYear);
    conditions.push(`exam_year = $${values.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM questions ${whereClause}`,
    values
  );

  const result = await query(
    `SELECT id, subject_id, class_id, question_type, question_text, options,
            difficulty, source, exam_year, exam_name, tags
     FROM questions
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
    `SELECT COALESCE(exam_name, source) AS name,
            COUNT(*)::int AS question_count,
            array_agg(DISTINCT exam_year) AS years
     FROM questions
     WHERE exam_name IS NOT NULL OR source IS NOT NULL
     GROUP BY COALESCE(exam_name, source)
     ORDER BY name`
  );

  res.json({ success: true, data: { exams: result.rows } });
};

export const getLibraryResource = async (req, res) => {
  const result = await query(
    `SELECT lr.*, l.id AS lesson_id, l.title AS lesson_title,
            c.id AS course_id, c.title AS course_title
     FROM lesson_resources lr
     JOIN lessons l ON l.id = lr.lesson_id
     JOIN courses c ON c.id = l.course_id
     WHERE lr.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) notFound('Resource');

  res.json({ success: true, data: { resource: result.rows[0] } });
};
