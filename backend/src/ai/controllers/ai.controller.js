import { HTTP_STATUS, ERROR_CODES, AppError } from '../../common/errors/index.js';
import { aiService } from '../services/ai.service.js';

const notFound = (message) => {
  throw new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const sendTutorMessage = async (req, res) => {
  const result = await aiService.chat(req.user.id, req.body);
  res.json({ success: true, data: result });
};

export const listTutorSessions = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const conversations = await aiService.listConversations(req.user.id, { page, limit });
  const totalResult = await (await import('../../common/database/index.js')).query(
    'SELECT COUNT(*)::int AS total FROM ai_conversations WHERE user_id = $1',
    [req.user.id]
  );
  const total = parseInt(totalResult.rows[0].total);
  res.json({
    success: true,
    data: { sessions: conversations },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getTutorSession = async (req, res) => {
  const session = await aiService.getConversation(req.params.sessionId, req.user.id);
  if (!session) notFound('Session');
  res.json({ success: true, data: { session } });
};

export const deleteTutorSession = async (req, res) => {
  await (await import('../../common/database/index.js')).query(
    'DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2',
    [req.params.sessionId, req.user.id]
  );
  res.json({ success: true, message: 'Session deleted' });
};

export const generateQuiz = async (req, res) => {
  const { subjectId, topicId, difficulty, questionCount, questionTypes } = req.body;
  const quiz = await aiService.generateQuiz({ ...req.body, userId: req.user.id });
  res.json({ success: true, data: { quiz } });
};

export const generateStudyPlan = async (req, res) => {
  const studyPlan = await aiService.generateStudyPlan(req.body);
  res.json({ success: true, data: { studyPlan } });
};

export const getExplanation = async (req, res) => {
  const explanation = await aiService.explain(req.body);
  res.json({ success: true, data: { explanation } });
};

export const generateFlashcards = async (req, res) => {
  const flashcards = await aiService.generateFlashcards(req.body);
  res.json({ success: true, data: { flashcards } });
};

export const generateSummary = async (req, res) => {
  const summary = await aiService.summarize(req.body);
  res.json({ success: true, data: { summary } });
};

export const getUsageStats = async (req, res) => {
  const stats = await aiService.getUsageStats(req.user.id);
  res.json({ success: true, data: { stats } });
};