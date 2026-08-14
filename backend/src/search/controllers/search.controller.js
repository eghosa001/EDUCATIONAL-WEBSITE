import { query } from '../../common/database/index.js';

export const globalSearch = async (req, res) => {
  const { q, type, page, limit } = req.query;
  const offset = (page - 1) * limit;

  if (!q) {
    return res.json({ success: true, data: { results: [], pagination: { page, limit, total: 0 } } });
  }

  const search = `%${q}%`;
  const results = {};

  if (!type || type === 'courses') {
    const result = await query(
      `SELECT id, 'course' AS type, title AS name, slug,
              short_description AS description, thumbnail_url, status
       FROM courses
       WHERE (title ILIKE $1 OR short_description ILIKE $1) AND status = 'published'
       ORDER BY title LIMIT $2`,
      [search, limit]
    );
    results.courses = result.rows;
  }

  if (!type || type === 'lessons') {
    const result = await query(
      `SELECT l.id, 'lesson' AS type, l.title AS name, l.slug, l.description,
              l.content_type, l.is_free, c.title AS course_title
       FROM lessons l
       JOIN courses c ON c.id = l.course_id
       WHERE (l.title ILIKE $1 OR l.written_content ILIKE $1) AND l.is_published = TRUE
       ORDER BY l.title LIMIT $2`,
      [search, limit]
    );
    results.lessons = result.rows;
  }

  if (!type || type === 'topics') {
    const result = await query(
      `SELECT t.id, 'topic' AS type, t.name, t.description, s.name AS subject_name
       FROM topics t
       JOIN subjects s ON s.id = t.subject_id
       WHERE t.name ILIKE $1 AND t.is_active = TRUE
       ORDER BY t.name LIMIT $2`,
      [search, limit]
    );
    results.topics = result.rows;
  }

  if (!type || type === 'questions') {
    const result = await query(
      `SELECT id, 'question' AS type, question_text AS name, question_type,
              difficulty, source, exam_year, exam_name
       FROM questions
       WHERE question_text ILIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [search, limit]
    );
    results.questions = result.rows;
  }

  if (!type || type === 'exams') {
    const result = await query(
      `SELECT id, 'exam' AS type, title AS name, slug, description,
              exam_type, is_public, is_active
       FROM exams
       WHERE title ILIKE $1
       ORDER BY title LIMIT $2`,
      [search, limit]
    );
    results.exams = result.rows;
  }

  const total = Object.values(results).reduce((sum, rows) => sum + rows.length, 0);

  res.json({
    success: true,
    data: {
      query: q,
      results,
      total,
    },
  });
};

export const searchSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({ success: true, data: { suggestions: [] } });
  }

  const search = `%${q}%`;

  const result = await query(
    `(SELECT name AS suggestion, 'subject' AS type FROM subjects WHERE name ILIKE $1 AND is_active = TRUE LIMIT 5)
     UNION ALL
     (SELECT name, 'topic' FROM topics WHERE name ILIKE $1 AND is_active = TRUE LIMIT 5)
     UNION ALL
     (SELECT title, 'course' FROM courses WHERE title ILIKE $1 AND status = 'published' LIMIT 5)
     LIMIT 10`,
    [search]
  );

  res.json({ success: true, data: { suggestions: result.rows } });
};
