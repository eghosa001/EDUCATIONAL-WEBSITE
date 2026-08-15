import { query } from '../../common/database/index.js';

export const searchService = {
  async globalSearch(queryText, filters = {}) {
    const conditions = [`($1)`];
    const values = [queryText];
    let idx = 2;

    if (filters.type && filters.type !== 'all') {
      conditions.push(`type = $${idx++}`);
      values.push(filters.type);
    }

    const results = {
      courses: [],
      lessons: [],
      questions: [],
      subjects: [],
      teachers: [],
      library: [],
      pastQuestions: [],
    };

    // Search courses
    const courseResult = await query(
      `SELECT id, title, slug, short_description, thumbnail_url, difficulty, is_free, price,
              rating, enrollment_count
       FROM courses WHERE title ILIKE $1 OR short_description ILIKE $1
       ORDER BY enrollment_count DESC LIMIT 10`,
      [`%${queryText}%`]
    );
    results.courses = courseResult.rows;

    // Search subjects
    const subjectResult = await query(
      `SELECT id, name, code, description, icon, color
       FROM subjects WHERE name ILIKE $1 OR description ILIKE $1
       ORDER BY order_index LIMIT 10`,
      [`%${queryText}%`]
    );
    results.subjects = subjectResult.rows;

    // Search questions
    const questionResult = await query(
      `SELECT id, question_text, question_type, difficulty, subject_id, topic_id
       FROM questions WHERE question_text ILIKE $1 AND is_active = TRUE
       ORDER BY usage_count DESC LIMIT 10`,
      [`%${queryText}%`]
    );
    results.questions = questionResult.rows;

    // Search teachers
    const teacherResult = await query(
      `SELECT u.id, u.first_name, u.last_name, t.specialization, t.qualification
       FROM users u JOIN teachers t ON u.id = t.user_id
       WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR t.specialization ILIKE $1
       LIMIT 10`,
      [`%${queryText}%`]
    );
    results.teachers = teacherResult.rows.map(r => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      specialization: r.specialization,
    }));

    // Search lessons
    const lessonResult = await query(
      `SELECT l.id, l.title, l.slug, l.description, l.video_duration_seconds,
              l.written_content, c.title AS course_title, c.slug AS course_slug
       FROM lessons l
       JOIN courses c ON c.id = l.course_id
       WHERE (l.title ILIKE $1 OR l.written_content ILIKE $1) AND l.is_published = TRUE
       ORDER BY l.created_at DESC LIMIT 10`,
      [`%${queryText}%`]
    );
    results.lessons = lessonResult.rows;

    // Search library resources
    const libraryResult = await query(
      `SELECT id, title, resource_type, file_url, description, subject_id, exam_board, exam_year,
              is_free, view_count
       FROM library_resources
       WHERE title ILIKE $1 OR description ILIKE $1
       ORDER BY view_count DESC LIMIT 10`,
      [`%${queryText}%`]
    );
    results.library = libraryResult.rows;

    // Search past questions
    const pastQResult = await query(
      `SELECT id, title, resource_type, file_url, description, exam_board, exam_year
       FROM library_resources
       WHERE resource_type = 'past_question' AND (title ILIKE $1 OR description ILIKE $1)
       ORDER BY exam_year DESC LIMIT 10`,
      [`%${queryText}%`]
    );
    results.pastQuestions = pastQResult.rows;

    return results;
  },

  async searchByCategory(category, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    switch (category) {
      case 'courses': {
        const result = await query(
          `SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        return result.rows;
      }
      case 'subjects': {
        const result = await query(
          `SELECT * FROM subjects WHERE is_active = TRUE ORDER BY order_index LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        return result.rows;
      }
      case 'teachers': {
        const result = await query(
          `SELECT u.*, t.qualification, t.specialization
           FROM users u JOIN teachers t ON u.id = t.user_id
           WHERE t.is_verified = TRUE ORDER BY t.rating DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        return result.rows;
      }
      default:
        return [];
    }
  },
};

export default searchService;
