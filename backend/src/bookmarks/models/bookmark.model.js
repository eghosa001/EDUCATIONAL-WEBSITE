import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const bookmarkModel = {
  async findById(id) {
    const result = await query(
      `SELECT b.*, c.title AS course_title, c.slug AS course_slug,
              l.title AS lesson_title
       FROM bookmarks b
       LEFT JOIN courses c ON b.course_id = c.id
       LEFT JOIN lessons l ON b.lesson_id = l.id
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUser(userId) {
    const result = await query(
      `SELECT b.*, c.title AS course_title, c.slug AS course_slug, c.thumbnail_url,
              c.difficulty, c.is_free, c.price, c.currency,
              l.title AS lesson_title
       FROM bookmarks b
       LEFT JOIN courses c ON b.course_id = c.id
       LEFT JOIN lessons l ON b.lesson_id = l.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async exists(userId, courseId, lessonId = null) {
    const result = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND course_id = $2 AND lesson_id = $3 LIMIT 1',
      [userId, courseId, lessonId]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const { userId, courseId, lessonId } = data;
    const existing = await this.exists(userId, courseId, lessonId);
    if (existing) return existing;

    const result = await query(
      `INSERT INTO bookmarks (user_id, course_id, lesson_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, courseId, lessonId]
    );
    return result.rows[0];
  },

  async delete(id, userId) {
    const result = await query(
      'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  async deleteByCourse(courseId, userId) {
    await query(
      'DELETE FROM bookmarks WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
  },

  async getCourseBookmarks(userId) {
    const result = await query(
      `SELECT b.*, c.title, c.slug, c.thumbnail_url, c.difficulty, c.is_free, c.price, c.currency
       FROM bookmarks b
       JOIN courses c ON b.course_id = c.id
       WHERE b.user_id = $1 AND b.lesson_id IS NULL
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async count(userId) {
    const result = await query('SELECT COUNT(*) as total FROM bookmarks WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0]?.total || 0);
  },
};
