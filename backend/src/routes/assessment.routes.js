import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as assessmentController from '../assessments/controllers/assessment.controller.js';

export const assessmentRoutes = Router();
const assessmentManager = requireRole('teacher', 'content_admin', 'super_admin');
const questionParams = Joi.object({ id: Joi.string().uuid().required(), questionId: Joi.string().uuid().required() });
const assessmentListQuery = schemas.pagination.keys({
  courseId: Joi.string().uuid().optional(),
  lessonId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
});

const quizCreateSchema = Joi.object({
  courseId: Joi.string().uuid().required(),
  lessonId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(300).required(),
  description: Joi.string().optional(),
  instructions: Joi.string().optional(),
  timeLimitMinutes: Joi.number().integer().min(1).optional(),
  passingScore: Joi.number().min(0).max(100).default(50),
  maxAttempts: Joi.number().integer().min(1).default(1),
  shuffleQuestions: Joi.boolean().default(true),
  showExplanation: Joi.boolean().default(true),
});

const quizUpdateSchema = quizCreateSchema.fork(
  ['courseId', 'title'],
  (s) => s.optional()
).keys({ isActive: Joi.boolean().optional() });

const addQuestionSchema = Joi.object({
  questionId: Joi.string().uuid().required(),
  orderIndex: Joi.number().integer().min(0).optional(),
  marks: Joi.number().min(0).precision(2).optional(),
});

assessmentRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: assessmentListQuery }),
  asyncHandler(assessmentController.listQuizzes)
);

assessmentRoutes.post('/',
  authMiddleware,
  assessmentManager,
  validateRequest(quizCreateSchema),
  asyncHandler(assessmentController.createQuiz)
);

assessmentRoutes.get('/:id',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(assessmentController.getQuiz)
);

assessmentRoutes.patch('/:id',
  authMiddleware,
  assessmentManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest(quizUpdateSchema),
  asyncHandler(assessmentController.updateQuiz)
);

assessmentRoutes.delete('/:id',
  authMiddleware,
  assessmentManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(assessmentController.deleteQuiz)
);

assessmentRoutes.post('/:id/questions',
  authMiddleware,
  assessmentManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest(addQuestionSchema),
  asyncHandler(assessmentController.addQuestion)
);

assessmentRoutes.delete('/:id/questions/:questionId',
  authMiddleware,
  assessmentManager,
  validateRequest({ params: questionParams }),
  asyncHandler(assessmentController.removeQuestion)
);
