import { assignmentModel } from '../models/assignment.model.js';
import { submissionModel } from '../models/submission.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listAssignments = async (req, res) => {
  const { page, limit, courseId, teacherId } = req.query;

  const { data, pagination } = await assignmentModel.list({ page, limit, courseId, teacherId });

  res.json({ success: true, data: { assignments: data }, pagination });
};

export const getAssignment = async (req, res) => {
  const assignment = await assignmentModel.findById(req.params.id);
  if (!assignment) notFound('Assignment');

  res.json({ success: true, data: { assignment } });
};

export const createAssignment = async (req, res) => {
  const course = await courseModel.findById(req.body.courseId);
  if (!course) notFound('Course');

  const assignment = await assignmentModel.create({
    ...req.body,
    teacherId: req.body.teacherId || req.user.id,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Assignment created',
    data: { assignment },
  });
};

export const updateAssignment = async (req, res) => {
  const assignment = await assignmentModel.update(req.params.id, req.body);
  if (!assignment) notFound('Assignment');

  res.json({ success: true, message: 'Assignment updated', data: { assignment } });
};

export const deleteAssignment = async (req, res) => {
  const assignment = await assignmentModel.delete(req.params.id);
  if (!assignment) notFound('Assignment');

  res.json({ success: true, message: 'Assignment deleted' });
};

export const listSubmissions = async (req, res) => {
  const assignment = await assignmentModel.findById(req.params.id);
  if (!assignment) notFound('Assignment');

  const submissions = await submissionModel.listByAssignment(assignment.id);

  res.json({ success: true, data: { submissions } });
};

export const getSubmission = async (req, res) => {
  const { id, submissionId } = req.params;

  const submission = await submissionModel.findById(submissionId);
  if (!submission) notFound('Submission');

  if (submission.assignment_id !== id) notFound('Submission');

  const isOwner = submission.student_id === req.user.id;
  if (!isOwner && req.user.role === 'student') {
    throw new AppError('Not authorized to view this submission', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  res.json({ success: true, data: { submission } });
};

export const submitAssignment = async (req, res) => {
  const { id } = req.params;
  const { content, fileUrls } = req.body;

  const assignment = await assignmentModel.findById(id);
  if (!assignment) notFound('Assignment');

  const existing = await submissionModel.findByAssignmentAndStudent(id, req.user.id);
  if (existing?.status === 'graded') {
    throw new AppError('This assignment has already been graded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.CONFLICT);
  }

  const isLate = assignment.due_date && new Date(assignment.due_date) < new Date();

  if (isLate && !assignment.allow_late_submission) {
    throw new AppError('Assignment submission period has ended', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const submission = await submissionModel.create({
    assignmentId: id,
    studentId: req.user.id,
    content,
    fileUrls,
  });

  if (isLate) {
    await submissionModel.markLate(submission.id);
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Assignment submitted',
    data: { submission },
  });
};

export const gradeSubmission = async (req, res) => {
  const { id, submissionId } = req.params;
  const { score, feedback } = req.body;

  const submission = await submissionModel.findById(submissionId);
  if (!submission) notFound('Submission');

  if (submission.assignment_id !== id) notFound('Submission');

  const assignment = await assignmentModel.findById(id);
  if (!assignment) notFound('Assignment');

  if (score > assignment.max_score) {
    throw new AppError(`Score cannot exceed max score of ${assignment.max_score}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const graded = await submissionModel.grade(submission.id, {
    score,
    feedback,
    gradedBy: req.user.id,
  });

  res.json({
    success: true,
    message: 'Submission graded',
    data: { submission: graded },
  });
};

export const getMySubmissions = async (req, res) => {
  const { page, limit } = req.query;

  const { data, pagination } = await submissionModel.listByStudent(req.user.id, { page, limit });

  res.json({ success: true, data: { submissions: data }, pagination });
};
