import { query } from '../../common/database/index.js';

export const submissionModel = {
  async findById(id) {
    const result = await query('SELECT * FROM submissions WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByAssignmentAndStudent(assignmentId, studentId) {
    const result = await query(
      'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );
    return result.rows[0] || null;
  },

  async create({ assignmentId, studentId, content, fileUrls }) {
    const result = await query(
      `INSERT INTO submissions (assignment_id, student_id, content, file_urls)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assignment_id, student_id) DO UPDATE
       SET content = EXCLUDED.content, file_urls = EXCLUDED.file_urls, status = 'submitted',
           submitted_at = NOW(), is_late = EXCLUDED.is_late
       RETURNING *`,
      [assignmentId, studentId, content, fileUrls]
    );
    return result.rows[0];
  },

  async markLate(id) {
    const result = await query(
      'UPDATE submissions SET is_late = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  async grade(id, { score, feedback, gradedBy }) {
    const result = await query(
      `UPDATE submissions
       SET score = $2, feedback = $3, graded_by = $4, graded_at = NOW(), status = 'graded'
       WHERE id = $1
       RETURNING *`,
      [id, score, feedback, gradedBy]
    );
    return result.rows[0] || null;
  },

  async listByAssignment(assignmentId) {
    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );
    return result.rows;
  },

  async listByStudent(studentId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT s.*, a.title, a.course_id
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );
    return { data: result.rows, page, limit };
  },
};

export default submissionModel;
