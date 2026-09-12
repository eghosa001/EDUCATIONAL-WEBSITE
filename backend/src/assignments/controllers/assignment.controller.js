import { assignmentModel } from '../models/assignment.model.js';
import { submissionModel } from '../models/submission.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const ADMIN_ROLES = new Set(['content_admin', 'super_admin']);
const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};
const isAdmin = (req) => ADMIN_ROLES.has(req.user?.role) || (req.user?.roles || []).some((role) => ADMIN_ROLES.has(role));
const canManageCourse = (req, course) => isAdmin(req) || course?.teacher_id === req.user?.id;
const assertCourseManager = (req, course) => {
  if (!canManageCourse(req, course)) {
    throw new AppError('Not authorized to manage this course assignment', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
};
const loadAssignmentContext = async (req, assignmentId) => {
  const assignment = await assignmentModel.findById(assignmentId);
  if (!assignment) notFound('Assignment');
  const course = await courseModel.findById(assignment.course_id);
  if (!course) notFound('Course');
  return { assignment, course };
};

export const listAssignments = async (req, res) => {
  const { page, limit, courseId, teacherId, isActive } = req.query;
  const manager = req.user && (isAdmin(req) || ['teacher'].includes(req.user.role) || (req.user.roles || []).includes('teacher'));
  const { data, pagination } = await assignmentModel.list({
    page,
    limit,
    courseId,
    teacherId: manager ? teacherId : undefined,
    isActive: manager ? isActive : true,
  });
  res.json({ success: true, data: { assignments: data }, pagination });
};

export const getAssignment = async (req, res) => {
  const { assignment, course } = await loadAssignmentContext(req, req.params.id);
  if (!assignment.is_active && !canManageCourse(req, course)) notFound('Assignment');
  res.json({ success: true, data: { assignment } });
};

export const createAssignment = async (req, res) => {
  const course = await courseModel.findById(req.body.courseId);
  if (!course) notFound('Course');
  assertCourseManager(req, course);

  const assignment = await assignmentModel.create({
    ...req.body,
    teacherId: req.user.id,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Assignment created',
    data: { assignment },
  });
};

export const updateAssignment = async (req, res) => {
  const { course } = await loadAssignmentContext(req, req.params.id);
  assertCourseManager(req, course);
  const assignment = await assignmentModel.update(req.params.id, req.body);
  if (!assignment) notFound('Assignment');
  res.json({ success: true, message: 'Assignment updated', data: { assignment } });
};

export const deleteAssignment = async (req, res) => {
  const { course } = await loadAssignmentContext(req, req.params.id);
  assertCourseManager(req, course);
  const assignment = await assignmentModel.delete(req.params.id);
  if (!assignment) notFound('Assignment');
  res.json({ success: true, message: 'Assignment deleted' });
};

export const listSubmissions = async (req, res) => {
  const { assignment, course } = await loadAssignmentContext(req, req.params.id);
  assertCourseManager(req, course);
  const submissions = await submissionModel.listByAssignment(assignment.id);
  res.json({ success: true, data: { submissions } });
};

export const getSubmission = async (req, res) => {
  const { id, submissionId } = req.params;
  const submission = await submissionModel.findById(submissionId);
  if (!submission || submission.assignment_id !== id) notFound('Submission');

  const { course } = await loadAssignmentContext(req, id);
  const isOwner = submission.student_id === req.user.id;
  if (!isOwner && !canManageCourse(req, course)) {
    throw new AppError('Not authorized to view this submission', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  res.json({ success: true, data: { submission } });
};

export const submitAssignment = async (req, res) => {
  const { id } = req.params;
  const { content, fileUrls } = req.body;

  const { assignment } = await loadAssignmentContext(req, id);
  if (!assignment.is_active) {
    throw new AppError('Assignment is not active', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  const enrollment = await studentCourseModel.findByStudentAndCourse(req.user.id, assignment.course_id);
  if (!enrollment) {
    throw new AppError('Enroll in the course before submitting assignments', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const existing = await submissionModel.findByAssignmentAndStudent(id, req.user.id);
  if (existing?.status === 'graded') {
    throw new AppError('This assignment has already been graded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.CONFLICT);
  }

  const isLate = Boolean(assignment.due_date && new Date(assignment.due_date).getTime() < Date.now());
  if (isLate && !assignment.allow_late_submission) {
    throw new AppError('Assignment submission period has ended', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const submission = await submissionModel.create({
    assignmentId: id,
    studentId: req.user.id,
    content,
    fileUrls,
    isLate,
  });

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
  if (!submission || submission.assignment_id !== id) notFound('Submission');

  const { assignment, course } = await loadAssignmentContext(req, id);
  assertCourseManager(req, course);

  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > Number(assignment.max_score)) {
    throw new AppError(`Score must be between 0 and ${assignment.max_score}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const graded = await submissionModel.grade(submission.id, {
    score: numericScore,
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
