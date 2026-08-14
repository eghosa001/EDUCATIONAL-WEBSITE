import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as progressController from '../progress/controllers/progress.controller.js';

export const progressRoutes = Router();

progressRoutes.use(authMiddleware);

const lessonProgressSchema = Joi.object({
  status: Joi.string().valid('not_started', 'in_progress', 'completed', 'paused').default('in_progress'),
  progressPercentage: Joi.number().min(0).max(100).default(0),
  watchTimeSeconds: Joi.number().integer().min(0).default(0),
  lastPositionSeconds: Joi.number().integer().min(0).default(0),
});

const studySessionSchema = Joi.object({
  courseId: Joi.string().uuid().optional(),
  lessonId: Joi.string().uuid().optional(),
  activityType: Joi.string().valid('watching', 'reading', 'quizzing', 'revising', 'other').default('watching'),
  metadata: Joi.object().optional(),
});

progressRoutes.get('/overview',
  asyncHandler(progressController.getMyOverview)
);

progressRoutes.get('/sessions',
  validateRequest({ query: schemas.pagination }),
  asyncHandler(progressController.listStudySessions)
);

progressRoutes.post('/sessions',
  validateRequest(studySessionSchema),
  asyncHandler(progressController.startStudySession)
);

progressRoutes.post('/sessions/:id/end',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(progressController.endStudySession)
);

progressRoutes.get('/courses/:courseId',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(progressController.getCourseProgress)
);

progressRoutes.patch('/courses/:courseId/lessons/:lessonId',
  validateRequest(lessonProgressSchema),
  asyncHandler(progressController.updateLessonProgress)
);

progressRoutes.post('/courses/:courseId/lessons/:lessonId/complete',
  asyncHandler(progressController.completeLesson)
);
