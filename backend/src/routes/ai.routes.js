import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as aiController from '../ai/controllers/ai.controller.js';

export const aiRoutes = Router();

aiRoutes.use(authMiddleware);

aiRoutes.post('/tutor', validateRequest(schemas.ai.chat), asyncHandler(aiController.sendTutorMessage));
aiRoutes.get('/tutor/sessions', validateRequest({ query: schemas.pagination }), asyncHandler(aiController.listTutorSessions));
aiRoutes.get('/tutor/sessions/:sessionId', asyncHandler(aiController.getTutorSession));
aiRoutes.delete('/tutor/sessions/:sessionId', asyncHandler(aiController.deleteTutorSession));

aiRoutes.post('/quiz-generator', validateRequest(Joi.object({
  subjectId: Joi.string().uuid().required(),
  topicId: Joi.string().uuid().optional(),
  difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').optional(),
  questionCount: Joi.number().integer().min(1).max(50).default(10),
  questionTypes: Joi.array().items(Joi.string()).optional(),
})), asyncHandler(aiController.generateQuiz));

aiRoutes.post('/study-plan', validateRequest(Joi.object({
  subjectId: Joi.string().uuid().required(),
  targetScore: Joi.number().min(0).max(100).optional(),
  availableHoursPerDay: Joi.number().min(0.5).max(24).required(),
  examDate: Joi.date().iso().optional(),
})), asyncHandler(aiController.generateStudyPlan));

aiRoutes.post('/explain', validateRequest(Joi.object({
  question: Joi.string().required(),
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
})), asyncHandler(aiController.getExplanation));

aiRoutes.post('/flashcards', validateRequest(Joi.object({
  subjectId: Joi.string().uuid().required(),
  topicId: Joi.string().uuid().optional(),
  count: Joi.number().integer().min(1).max(50).default(10),
})), asyncHandler(aiController.generateFlashcards));

aiRoutes.post('/summarize', validateRequest(Joi.object({
  content: Joi.string().required(),
  type: Joi.string().valid('lesson', 'article', 'video_transcript').default('lesson'),
  length: Joi.string().valid('short', 'medium', 'detailed').default('medium'),
})), asyncHandler(aiController.generateSummary));

aiRoutes.get('/usage', asyncHandler(aiController.getUsageStats));