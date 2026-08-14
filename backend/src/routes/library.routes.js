import { Router } from 'express';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as libraryController from '../library/controllers/library.controller.js';

export const libraryRoutes = Router();

libraryRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(libraryController.listLibrary)
);

libraryRoutes.get('/stats',
  authMiddleware,
  asyncHandler(libraryController.getLibraryStats)
);

libraryRoutes.get('/past-questions/exams',
  authMiddleware,
  asyncHandler(libraryController.getPastQuestionExams)
);

libraryRoutes.get('/past-questions',
  authMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(libraryController.listPastQuestions)
);

libraryRoutes.get('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(libraryController.getLibraryResource)
);
