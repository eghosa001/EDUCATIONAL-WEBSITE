import { query } from '../../common/database/index.js';

export const studentCourseModel = {
  async findById(id) {
    const result = await query('SELECT * FROM student_courses WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByStudentAndCourse(studentId, courseId) {
    const result = await query(
      'SELECT * FROM student_courses WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    return result.rows[0] || null;
  },

  async create({ studentId, courseId }) {
    const result = await query(
      `INSERT INTO student_courses (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING *`,
      [studentId, courseId]
    );
    return result.rows[0] || null;
  },

  async updateProgress(studentId, courseId, progressPercentage) {
    const result = await query(
      `UPDATE student_courses
       SET progress_percentage = $3,
           last_accessed_at = NOW(),
           completed_at = CASE WHEN $3 >= 100 THEN NOW() ELSE completed_at END
       WHERE student_id = $1 AND course_id = $2
       RETURNING *`,
      [studentId, courseId, progressPercentage]
    );
    return result.rows[0] || null;
  },

  async markComplete(studentId, courseId, certificateUrl) {
    const result = await query(
      `UPDATE student_courses
       SET progress_percentage = 100, completed_at = NOW(), certificate_issued_at = NOW(), certificate_url = $3
       WHERE student_id = $1 AND course_id = $2
       RETURNING *`,
      [studentId, courseId, certificateUrl]
    );
    return result.rows[0] || null;
  },

  async listByStudent(studentId) {
    const result = await query(
      `SELECT sc.*, c.title, c.slug, c.thumbnail_url, c.subject_id, c.class_id, c.teacher_id
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       WHERE sc.student_id = $1
       ORDER BY sc.last_accessed_at DESC`,
      [studentId]
    );
    return result.rows;
  },

  async listByCourse(courseId) {
    const result = await query(
      `SELECT sc.*, u.first_name, u.last_name, u.email
       FROM student_courses sc
       JOIN users u ON u.id = sc.student_id
       WHERE sc.course_id = $1
       ORDER BY sc.enrolled_at DESC`,
      [courseId]
    );
    return result.rows;
  },

  async delete(studentId, courseId) {
    const result = await query(
      'DELETE FROM student_courses WHERE student_id = $1 AND course_id = $2 RETURNING id',
      [studentId, courseId]
    );
    return result.rows[0] || null;
  },
};

export default studentCourseModel;
