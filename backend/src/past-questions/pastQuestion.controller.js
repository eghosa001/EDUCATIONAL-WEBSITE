import { pastQuestionModel } from './models/pastQuestion.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../common/errors/index.js';
import { pastQuestionService } from './services/pastQuestion.service.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listQuestions = async (req, res) => {
  const { page, limit, board, year, subjectId, topicId, questionType, difficulty, search } = req.query;

  const { data, pagination } = await pastQuestionModel.list({
    page, limit, board, year, subjectId, topicId, questionType, difficulty, search,
  });

  res.json({ success: true, data: { questions: data }, pagination });
};

export const getQuestion = async (req, res) => {
  const question = await pastQuestionModel.findById(req.params.id);
  if (!question) notFound('Past question');

  await pastQuestionModel.incrementUsage(req.params.id);

  res.json({ success: true, data: { question } });
};

export const createQuestion = async (req, res) => {
  const question = await pastQuestionModel.create({
    ...req.body,
    createdBy: req.user.id,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Past question created',
    data: { question },
  });
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
  const { data, pagination } = await pastQuestionModel.listByBoard(req.params.board, { page, limit, subjectId, year });

  res.json({ success: true, data: { questions: data }, pagination });
};

export const listBySubject = async (req, res) => {
  const { page, limit, board, year } = req.query;
  const { data, pagination } = await pastQuestionModel.listBySubject(req.params.subjectId, { page, limit, board, year });

  res.json({ success: true, data: { questions: data }, pagination });
};

export const getTopicsByBoard = async (req, res) => {
  const topics = await pastQuestionModel.getTopicsByBoard(req.params.board);
  res.json({ success: true, data: { topics } });
};

export const getYearsByBoard = async (req, res) => {
  const years = await pastQuestionModel.getYearsByBoard(req.params.board);
  res.json({ success: true, data: { years } });
};

export const getBoards = async (req, res) => {
  const boards = await pastQuestionService.getBoards();
  res.json({ success: true, data: { boards } });
};

export const getBoardStats = async (req, res) => {
  const stats = await pastQuestionService.getBoardStats(req.params.board);
  res.json({ success: true, data: { stats } });
};

export const getPracticeQuestions = async (req, res) => {
  const { board } = req.params;
  const { subjectId, topicId, count = 20 } = req.query;

  const questions = await pastQuestionService.getQuestionsForPractice(board, subjectId, topicId, count);

  res.json({ success: true, data: { questions } });
};

export const generateTimedTest = async (req, res) => {
  const { board } = req.params;
  const { subjectId, count = 40 } = req.query;

  const test = await pastQuestionService.generateTimedTest(board, subjectId, count);

  res.json({ success: true, data: { test } });
};

export const getAnalytics = async (req, res) => {
  const { board } = req.params;
  const { subjectId } = req.query;

  const analytics = await pastQuestionService.getAnalytics(board, subjectId);
  res.json({ success: true, data: { analytics } });
};

export const bulkImport = async (req, res) => {
  const { questions } = req.body;
  const imported = await pastQuestionModel.bulkImport(questions.map(q => ({ ...q, createdBy: req.user.id })));

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `${imported.length} questions imported`,
    data: { questions: imported },
  });
};
