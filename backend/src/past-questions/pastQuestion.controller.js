import { pastQuestionModel } from './models/pastQuestion.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../common/errors/index.js';
import { pastQuestionService } from './services/pastQuestion.service.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const safeQuestion = (question) => {
  if (!question) return question;
  const { correct_answer, explanation, ...safe } = question;
  return safe;
};

const normalizeAnswer = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(normalizeAnswer).sort().join('|');
  if (typeof value === 'object') {
    if ('id' in value) return normalizeAnswer(value.id);
    if ('label' in value) return normalizeAnswer(value.label);
    if ('answer' in value) return normalizeAnswer(value.answer);
    if ('value' in value) return normalizeAnswer(value.value);
    return JSON.stringify(value, Object.keys(value).sort()).toLowerCase().trim();
  }
  return String(value).toLowerCase().trim().replace(/\s+/g, ' ');
};

export const listQuestions = async (req, res) => {
  const { page, limit, board, year, subjectId, topicId, questionType, difficulty, search } = req.query;
  const { data, pagination } = await pastQuestionModel.list({
    page, limit, board, year, subjectId, topicId, questionType, difficulty, search, isActive: true,
  });
  res.json({ success: true, data: { questions: data.map(safeQuestion) }, pagination });
};

export const getQuestion = async (req, res) => {
  const question = await pastQuestionModel.findById(req.params.id);
  if (!question || !question.is_active) notFound('Past question');
  await pastQuestionModel.incrementUsage(req.params.id);
  res.json({ success: true, data: { question: safeQuestion(question) } });
};

export const checkAnswer = async (req, res) => {
  const question = await pastQuestionModel.findById(req.params.id);
  if (!question || !question.is_active) notFound('Past question');
  const submitted = normalizeAnswer(req.body.answer);
  const expected = normalizeAnswer(question.correct_answer);
  const isCorrect = Boolean(expected) && submitted === expected;
  res.json({
    success: true,
    data: {
      result: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation || null,
      },
    },
  });
};

export const createQuestion = async (req, res) => {
  const question = await pastQuestionModel.create({ ...req.body, createdBy: req.user.id });
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Past question created', data: { question } });
};

export const updateQuestion = async (req, res) => {
  const question = await pastQuestionModel.update(req.params.id, req.body);
  if (!question) notFound('Past question');
  res.json({ success: true, message: 'Past question updated', data: { question } });
};

export const deleteQuestion = async (req, res) => {
  const { query } = await import('../common/database/index.js');
  const result = await query('DELETE FROM past_questions WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) notFound('Past question');
  res.json({ success: true, message: 'Past question deleted' });
};

export const listByBoard = async (req, res) => {
  const { page, limit, subjectId, year } = req.query;
  const { data, pagination } = await pastQuestionModel.listByBoard(req.params.board, { page, limit, subjectId, year, isActive: true });
  res.json({ success: true, data: { questions: data.map(safeQuestion) }, pagination });
};

export const listBySubject = async (req, res) => {
  const { page, limit, board, year } = req.query;
  const { data, pagination } = await pastQuestionModel.listBySubject(req.params.subjectId, { page, limit, board, year, isActive: true });
  res.json({ success: true, data: { questions: data.map(safeQuestion) }, pagination });
};

export const getTopicsByBoard = async (req, res) => {
  const topics = await pastQuestionModel.getTopicsByBoard(req.params.board);
  res.json({ success: true, data: { topics } });
};

export const getYearsByBoard = async (req, res) => {
  const years = await pastQuestionModel.getYearsByBoard(req.params.board);
  res.json({ success: true, data: { years } });
};

export const getBoards = async (_req, res) => {
  const boards = await pastQuestionService.getBoards();
  res.json({ success: true, data: { boards } });
};

export const getBoardStats = async (req, res) => {
  const stats = await pastQuestionService.getBoardStats(req.params.board);
  res.json({ success: true, data: { stats } });
};

export const getPracticeQuestions = async (req, res) => {
  const { board } = req.params;
  const { subjectId, topicId } = req.query;
  const count = Math.min(100, Math.max(1, Number.parseInt(req.query.count, 10) || 20));
  const questions = await pastQuestionService.getQuestionsForPractice(board, subjectId, topicId, count);
  res.json({ success: true, data: { questions: questions.map(safeQuestion) } });
};

export const generateTimedTest = async (req, res) => {
  const { board } = req.params;
  const { subjectId } = req.query;
  const count = Math.min(100, Math.max(1, Number.parseInt(req.query.count, 10) || 40));
  const questions = await pastQuestionService.getQuestionsForPractice(board, subjectId, null, count);
  const test = {
    questions: questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_image_url: q.question_image_url,
      options: q.options,
      question_type: q.question_type,
      difficulty: q.difficulty,
      marks: q.marks,
      subject_id: q.subject_id,
      topic_id: q.topic_id,
      year: q.year,
      board: q.board,
    })),
    durationMinutes: Math.ceil(questions.length * 1.5),
    totalMarks: questions.reduce((sum, q) => sum + Number(q.marks || 1), 0),
  };
  res.json({ success: true, data: { test } });
};

export const getAnalytics = async (req, res) => {
  const { board } = req.params;
  const { subjectId } = req.query;
  const analytics = await pastQuestionModel.getAnalytics(board, subjectId);
  res.json({ success: true, data: { analytics } });
};

export const bulkImport = async (req, res) => {
  const { questions } = req.body;
  const imported = await pastQuestionModel.bulkImport(questions.map(q => ({ ...q, createdBy: req.user.id })));
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: `${imported.length} questions imported`, data: { questions: imported } });
};
