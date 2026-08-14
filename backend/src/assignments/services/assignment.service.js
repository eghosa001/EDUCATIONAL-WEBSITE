import { query } from '../../common/database/index.js';
import assignmentModel from '../models/assignment.model.js';
import submissionModel from '../models/submission.model.js';

export const assignmentService = {
  async create(data) {
    return assignmentModel.create(data);
  },

  async getById(id) {
    const assignment = await assignmentModel.findById(id);
    if (!assignment) throw new Error('Assignment not found');
    return assignment;
  },

  async list(params) {
    return assignmentModel.list(params);
  },

  async update(id, data) {
    return assignmentModel.update(id, data);
  },

  async delete(id) {
    return assignmentModel.delete(id);
  },

  async submit(userId, assignmentId, data) {
    const existing = await submissionModel.findByStudentAndAssignment(userId, assignmentId);
    if (existing) throw new Error('Already submitted');

    return submissionModel.create({ studentId: userId, assignmentId, ...data });
  },

  async getMySubmissions(userId, params) {
    return submissionModel.listByStudent(userId, params);
  },

  async gradeSubmission(submissionId, graderId, data) {
    return submissionModel.grade(submissionId, graderId, data);
  },

  async getAssignmentStats(assignmentId) {
    const result = await query(
      `SELECT COUNT(*)::int as total_submissions,
              AVG(score) as avg_score,
              COUNT(*) FILTER (WHERE graded_at IS NOT NULL) as graded_count
       FROM submissions WHERE assignment_id = $1`,
      [assignmentId]
    );
    return result.rows[0];
  },

  async getLateSubmissions(userId) {
    const result = await query(
      `SELECT s.*, a.title, a.due_date, a.course_id
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = $1 AND s.is_late = TRUE AND s.status = 'submitted'
       ORDER BY s.submitted_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

export default assignmentService;
