import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as questionController from '../questions/controllers/question.controller.js';

export const questionRoutes = Router();
const questionManager = requireRole('teacher', 'content_admin', 'super_admin');
const questionReviewer = requireRole('content_admin', 'super_admin');

const questionListQuery = schemas.pagination.keys({
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  classId: Joi.string().uuid().optional(),
  difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').optional(),
  questionType: Joi.string().valid(
    'mcq', 'true_false', 'fill_blank', 'matching',
    'short_answer', 'essay', 'numerical', 'image_based', 'multiple_select'
  ).optional(),
  examName: Joi.string().max(100).optional(),
  examYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  isActive: Joi.boolean().optional(),
});

const updateQuestionSchema = Joi.object({
  questionText: Joi.string().optional(),
  questionImageUrl: Joi.string().uri().max(500).allow(null, '').optional(),
  options: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    text: Joi.string().required(),
    imageUrl: Joi.string().uri().max(500).optional(),
  })).min(2).max(6).optional(),
  correctAnswer: Joi.alternatives().try(
    Joi.string(), Joi.number(), Joi.boolean(), Joi.array().items(Joi.string())
  ).optional(),
  explanation: Joi.string().allow('').optional(),
  difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').optional(),
  marks: Joi.number().min(0).precision(2).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);
const checkAnswerSchema = Joi.object({
  answer: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array(), Joi.object()).required(),
});

questionRoutes.get('/', optionalAuthMiddleware, validateRequest({ query: questionListQuery }), asyncHandler(questionController.listQuestions));
questionRoutes.post('/', authMiddleware, questionManager, validateRequest(schemas.question.create), asyncHandler(questionController.createQuestion));
questionRoutes.post('/bulk', authMiddleware, questionManager, validateRequest(schemas.question.bulkImport), asyncHandler(questionController.bulkImportQuestions));
questionRoutes.post('/:id/check', authMiddleware, validateRequest({ params: schemas.idParam }), validateRequest(checkAnswerSchema), asyncHandler(questionController.checkAnswer));
questionRoutes.get('/:id', optionalAuthMiddleware, validateRequest({ params: schemas.idParam }), asyncHandler(questionController.getQuestion));
questionRoutes.patch('/:id', authMiddleware, questionManager, validateRequest({ params: schemas.idParam }), validateRequest(updateQuestionSchema), asyncHandler(questionController.updateQuestion));
questionRoutes.post('/:id/review', authMiddleware, questionReviewer, validateRequest({ params: schemas.idParam }), asyncHandler(questionController.reviewQuestion));
questionRoutes.delete('/:id', authMiddleware, questionManager, validateRequest({ params: schemas.idParam }), asyncHandler(questionController.deleteQuestion));
