import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as flashcardController from '../flashcards/flashcard.controller.js';

export const flashcardRoutes = Router();

flashcardRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(flashcardController.listFlashcards)
);

flashcardRoutes.post('/',
  authMiddleware,
  validateRequest(schemas.flashcard.create),
  asyncHandler(flashcardController.createFlashcard)
);

flashcardRoutes.get('/:id',
  optionalAuthMiddleware,
  asyncHandler(flashcardController.getFlashcard)
);

flashcardRoutes.patch('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(flashcardController.updateFlashcard)
);

flashcardRoutes.delete('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(flashcardController.deleteFlashcard)
);