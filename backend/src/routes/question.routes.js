import { Router } from 'express';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as questionController from '../questions/controllers/question.controller.js';

export const questionRoutes = Router();

questionRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(questionController.listQuestions)
);

questionRoutes.post('/',
  authMiddleware,
  validateRequest(schemas.question.create),
  asyncHandler(questionController.createQuestion)
);

questionRoutes.post('/bulk',
  authMiddleware,
  validateRequest(schemas.question.bulkImport),
  asyncHandler(questionController.bulkImportQuestions)
);

questionRoutes.get('/:id',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(questionController.getQuestion)
);

questionRoutes.patch('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(questionController.updateQuestion)
);

questionRoutes.post('/:id/review',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(questionController.reviewQuestion)
);

questionRoutes.delete('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(questionController.deleteQuestion)
);
