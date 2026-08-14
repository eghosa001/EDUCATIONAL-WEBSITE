import { quizModel } from '../models/quiz.model.js';
import { quizQuestionModel } from '../models/quizQuestion.model.js';
import { questionModel } from '../../questions/models/question.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listQuizzes = async (req, res) => {
  const { page, limit, courseId, lessonId } = req.query;

  const { data, pagination } = await quizModel.list({ page, limit, courseId, lessonId });

  res.json({ success: true, data: { quizzes: data }, pagination });
};

export const getQuiz = async (req, res) => {
  const quiz = await quizModel.findById(req.params.id);
  if (!quiz) notFound('Quiz');

  const questions = await quizQuestionModel.listByQuiz(quiz.id);

  res.json({ success: true, data: { quiz: { ...quiz, questions } } });
};

export const createQuiz = async (req, res) => {
  const course = await courseModel.findById(req.body.courseId);
  if (!course) notFound('Course');

  const quiz = await quizModel.create(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Quiz created',
    data: { quiz },
  });
};

export const updateQuiz = async (req, res) => {
  const quiz = await quizModel.update(req.params.id, req.body);
  if (!quiz) notFound('Quiz');

  res.json({ success: true, message: 'Quiz updated', data: { quiz } });
};

export const deleteQuiz = async (req, res) => {
  const quiz = await quizModel.delete(req.params.id);
  if (!quiz) notFound('Quiz');

  res.json({ success: true, message: 'Quiz deleted' });
};

export const addQuestion = async (req, res) => {
  const { id } = req.params;
  const { questionId, orderIndex, marks } = req.body;

  const quiz = await quizModel.findById(id);
  if (!quiz) notFound('Quiz');

  const question = await questionModel.findById(questionId);
  if (!question) notFound('Question');

  const entry = await quizQuestionModel.addQuestion({ quizId: id, questionId, orderIndex, marks });
  if (!entry) {
    throw new AppError('Question already in quiz', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Question added to quiz',
    data: { entry },
  });
};

export const removeQuestion = async (req, res) => {
  const { id, questionId } = req.params;

  await quizQuestionModel.removeQuestion(id, questionId);

  res.json({ success: true, message: 'Question removed from quiz' });
};
