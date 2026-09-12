import { quizModel } from '../models/quiz.model.js';
import { quizQuestionModel } from '../models/quizQuestion.model.js';
import { questionModel } from '../../questions/models/question.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const ADMIN_ROLES = new Set(['content_admin', 'super_admin']);
const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};
const isAdmin = (req) => ADMIN_ROLES.has(req.user?.role) || (req.user?.roles || []).some((role) => ADMIN_ROLES.has(role));
const canManageCourse = (req, course) => Boolean(req.user && (isAdmin(req) || course?.teacher_id === req.user.id));
const assertCourseManager = (req, course) => {
  if (!canManageCourse(req, course)) {
    throw new AppError('Not authorized to manage this quiz', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
};
const loadQuizContext = async (req, quizId) => {
  const quiz = await quizModel.findById(quizId);
  if (!quiz) notFound('Quiz');
  const course = await courseModel.findById(quiz.course_id);
  if (!course) notFound('Course');
  return { quiz, course };
};

export const listQuizzes = async (req, res) => {
  const { page, limit, courseId, lessonId, isActive } = req.query;
  const manager = Boolean(req.user && (isAdmin(req) || req.user.role === 'teacher' || (req.user.roles || []).includes('teacher')));
  const { data, pagination } = await quizModel.list({
    page,
    limit,
    courseId,
    lessonId,
    isActive: manager ? isActive : true,
  });
  res.json({ success: true, data: { quizzes: data }, pagination });
};

export const getQuiz = async (req, res) => {
  const { quiz, course } = await loadQuizContext(req, req.params.id);
  if (!quiz.is_active && !canManageCourse(req, course)) notFound('Quiz');
  const questions = await quizQuestionModel.listByQuiz(quiz.id);
  res.json({ success: true, data: { quiz: { ...quiz, questions } } });
};

export const createQuiz = async (req, res) => {
  const course = await courseModel.findById(req.body.courseId);
  if (!course) notFound('Course');
  assertCourseManager(req, course);
  const quiz = await quizModel.create(req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Quiz created', data: { quiz } });
};

export const updateQuiz = async (req, res) => {
  const { course } = await loadQuizContext(req, req.params.id);
  assertCourseManager(req, course);
  const quiz = await quizModel.update(req.params.id, req.body);
  if (!quiz) notFound('Quiz');
  res.json({ success: true, message: 'Quiz updated', data: { quiz } });
};

export const deleteQuiz = async (req, res) => {
  const { course } = await loadQuizContext(req, req.params.id);
  assertCourseManager(req, course);
  const quiz = await quizModel.delete(req.params.id);
  if (!quiz) notFound('Quiz');
  res.json({ success: true, message: 'Quiz deleted' });
};

export const addQuestion = async (req, res) => {
  const { id } = req.params;
  const { questionId, orderIndex, marks } = req.body;
  const { course } = await loadQuizContext(req, id);
  assertCourseManager(req, course);

  const question = await questionModel.findById(questionId);
  if (!question || !question.is_active) notFound('Question');

  const entry = await quizQuestionModel.addQuestion({ quizId: id, questionId, orderIndex, marks });
  if (!entry) throw new AppError('Question already in quiz', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Question added to quiz', data: { entry } });
};

export const removeQuestion = async (req, res) => {
  const { id, questionId } = req.params;
  const { course } = await loadQuizContext(req, id);
  assertCourseManager(req, course);
  await quizQuestionModel.removeQuestion(id, questionId);
  res.json({ success: true, message: 'Question removed from quiz' });
};
