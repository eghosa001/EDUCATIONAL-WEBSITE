import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as examController from '../exams/controllers/exam.controller.js';

export const examRoutes = Router();

const examManager = requireRole('teacher', 'content_admin', 'super_admin');
const attemptParams = Joi.object({ id: Joi.string().uuid().required(), attemptId: Joi.string().uuid().required() });
const questionParams = Joi.object({ id: Joi.string().uuid().required(), questionId: Joi.string().uuid().required() });

const addQuestionSchema = Joi.object({
  questionId: Joi.string().uuid().required(),
  orderIndex: Joi.number().integer().min(0).optional(),
  marks: Joi.number().min(0).precision(2).optional(),
  sectionName: Joi.string().max(100).optional(),
});

const submitSchema = Joi.object({
  answers: Joi.array().items(Joi.object({
    questionId: Joi.string().uuid().required(),
    studentAnswer: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.array().items(Joi.string()),
      Joi.object(),
      Joi.array().items(Joi.object().pattern(Joi.string(), Joi.any()))
    ).required(),
    timeSpentSeconds: Joi.number().integer().min(0).optional(),
  })).min(0).required(),
  timeSpentSeconds: Joi.number().integer().min(0).optional(),
});

examRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(examController.listExams)
);

examRoutes.get('/my-attempts',
  authMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(examController.getMyAttempts)
);

examRoutes.post('/',
  authMiddleware,
  examManager,
  validateRequest(schemas.exam.create),
  asyncHandler(examController.createExam)
);

examRoutes.get('/:id',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.getExam)
);

examRoutes.patch('/:id',
  authMiddleware,
  examManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.updateExam)
);

examRoutes.delete('/:id',
  authMiddleware,
  examManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.deleteExam)
);

examRoutes.get('/:id/questions',
  authMiddleware,
  examManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.listExamQuestions)
);

examRoutes.post('/:id/questions',
  authMiddleware,
  examManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest(addQuestionSchema),
  asyncHandler(examController.addQuestion)
);

examRoutes.delete('/:id/questions/:questionId',
  authMiddleware,
  examManager,
  validateRequest({ params: questionParams }),
  asyncHandler(examController.removeQuestion)
);

examRoutes.post('/:id/attempts',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.startAttempt)
);

examRoutes.post('/:id/publish',
  authMiddleware,
  examManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.publishExam)
);

examRoutes.get('/:id/attempts',
  authMiddleware,
  examManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(examController.listAttempts)
);

examRoutes.get('/:id/attempts/:attemptId',
  authMiddleware,
  validateRequest({ params: attemptParams }),
  asyncHandler(examController.getAttempt)
);

examRoutes.post('/:id/attempts/:attemptId/submit',
  authMiddleware,
  validateRequest({ params: attemptParams }),
  validateRequest(submitSchema),
  asyncHandler(examController.submitAttempt)
);

examRoutes.get('/:id/leaderboard',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(examController.getLeaderboard)
);
