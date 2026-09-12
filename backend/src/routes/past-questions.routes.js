import { Router } from 'express';
import Joi from 'joi';
import { validateRequest, asyncHandler, authMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as pastQuestionController from '../past-questions/pastQuestion.controller.js';
import * as pastQuestionFileController from '../past-questions/controllers/pastQuestionFile.controller.js';

export const pastQuestionRoutes = Router();
const manager = requireRole('teacher', 'super_admin', 'content_admin');
const boardParam = Joi.object({ board: Joi.string().lowercase().max(50).required() });
const listQuery = schemas.pagination.keys({
  board: Joi.string().lowercase().max(50).optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  questionType: Joi.string().max(50).optional(),
  difficulty: Joi.string().max(30).optional(),
});
const boardListQuery = schemas.pagination.keys({
  subjectId: Joi.string().uuid().optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
});
const subjectListQuery = schemas.pagination.keys({
  board: Joi.string().lowercase().max(50).optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
});
const practiceQuery = Joi.object({
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  count: Joi.number().integer().min(1).max(100).default(20),
});
const timedQuery = Joi.object({
  subjectId: Joi.string().uuid().optional(),
  count: Joi.number().integer().min(1).max(100).default(40),
});
const analyticsQuery = Joi.object({ subjectId: Joi.string().uuid().optional() });
const checkAnswerSchema = Joi.object({
  answer: Joi.alternatives().try(
    Joi.string(), Joi.number(), Joi.boolean(), Joi.array(), Joi.object()
  ).required(),
});

pastQuestionRoutes.get('/files', asyncHandler(pastQuestionFileController.listFiles));
pastQuestionRoutes.get('/files/stats', asyncHandler(pastQuestionFileController.getStats));
pastQuestionRoutes.get('/files/boards', asyncHandler(pastQuestionFileController.getBoards));
pastQuestionRoutes.get('/files/boards/:board', validateRequest({ params: boardParam }), asyncHandler(pastQuestionFileController.listFilesByBoard));
pastQuestionRoutes.get('/files/boards/:board/subjects', validateRequest({ params: boardParam }), asyncHandler(pastQuestionFileController.getSubjectsByBoard));
pastQuestionRoutes.get('/files/boards/:board/years', validateRequest({ params: boardParam }), asyncHandler(pastQuestionFileController.getYearsByBoard));
pastQuestionRoutes.get('/files/:id', validateRequest({ params: schemas.idParam }), asyncHandler(pastQuestionFileController.getFile));
pastQuestionRoutes.patch('/files/:id/process', authMiddleware, requireRole('super_admin', 'content_admin'), validateRequest({ params: schemas.idParam }), asyncHandler(pastQuestionFileController.markProcessed));

pastQuestionRoutes.get('/boards', asyncHandler(pastQuestionController.getBoards));
pastQuestionRoutes.get('/', validateRequest({ query: listQuery }), asyncHandler(pastQuestionController.listQuestions));
pastQuestionRoutes.get('/boards/:board/stats', validateRequest({ params: boardParam }), asyncHandler(pastQuestionController.getBoardStats));
pastQuestionRoutes.get('/boards/:board/topics', validateRequest({ params: boardParam }), asyncHandler(pastQuestionController.getTopicsByBoard));
pastQuestionRoutes.get('/boards/:board/years', validateRequest({ params: boardParam }), asyncHandler(pastQuestionController.getYearsByBoard));
pastQuestionRoutes.get('/boards/:board/questions', validateRequest({ params: boardParam }), validateRequest({ query: boardListQuery }), asyncHandler(pastQuestionController.listByBoard));
pastQuestionRoutes.get('/subjects/:subjectId/questions', validateRequest({ params: Joi.object({ subjectId: Joi.string().uuid().required() }) }), validateRequest({ query: subjectListQuery }), asyncHandler(pastQuestionController.listBySubject));
pastQuestionRoutes.get('/boards/:board/practice', validateRequest({ params: boardParam }), validateRequest({ query: practiceQuery }), asyncHandler(pastQuestionController.getPracticeQuestions));
pastQuestionRoutes.get('/boards/:board/timed-test', validateRequest({ params: boardParam }), validateRequest({ query: timedQuery }), asyncHandler(pastQuestionController.generateTimedTest));
pastQuestionRoutes.get('/boards/:board/analytics', validateRequest({ params: boardParam }), validateRequest({ query: analyticsQuery }), asyncHandler(pastQuestionController.getAnalytics));

pastQuestionRoutes.post('/:id/check', authMiddleware, validateRequest({ params: schemas.idParam }), validateRequest(checkAnswerSchema), asyncHandler(pastQuestionController.checkAnswer));
pastQuestionRoutes.get('/:id', validateRequest({ params: schemas.idParam }), asyncHandler(pastQuestionController.getQuestion));
pastQuestionRoutes.post('/', authMiddleware, manager, asyncHandler(pastQuestionController.createQuestion));
pastQuestionRoutes.post('/bulk-import', authMiddleware, manager, asyncHandler(pastQuestionController.bulkImport));
pastQuestionRoutes.patch('/:id', authMiddleware, manager, validateRequest({ params: schemas.idParam }), asyncHandler(pastQuestionController.updateQuestion));
pastQuestionRoutes.delete('/:id', authMiddleware, manager, validateRequest({ params: schemas.idParam }), asyncHandler(pastQuestionController.deleteQuestion));
