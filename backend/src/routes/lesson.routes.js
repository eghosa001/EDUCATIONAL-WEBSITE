import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as lessonController from '../lessons/controllers/lesson.controller.js';

export const lessonRoutes = Router();

const resourceSchema = Joi.object({
  title: Joi.string().min(2).max(300).required(),
  resourceType: Joi.string().valid('video', 'document', 'image', 'audio', 'archive', 'other').required(),
  fileUrl: Joi.string().uri().max(500).required(),
  fileSizeBytes: Joi.number().integer().min(0).optional(),
  mimeType: Joi.string().max(100).optional(),
  description: Joi.string().optional(),
  isDownloadable: Joi.boolean().default(false),
  orderIndex: Joi.number().integer().min(0).default(0),
});

lessonRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(lessonController.listLessons)
);

lessonRoutes.post('/',
  authMiddleware,
  validateRequest(schemas.lesson.create),
  asyncHandler(lessonController.createLesson)
);

lessonRoutes.get('/:slugOrId',
  optionalAuthMiddleware,
  asyncHandler(lessonController.getLesson)
);

lessonRoutes.patch('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(schemas.lesson.update),
  asyncHandler(lessonController.updateLesson)
);

lessonRoutes.post('/:id/publish',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(lessonController.publishLesson)
);

lessonRoutes.post('/:id/complete',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(lessonController.completeLesson)
);

lessonRoutes.delete('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(lessonController.deleteLesson)
);

lessonRoutes.get('/:id/resources',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(lessonController.listResources)
);

lessonRoutes.post('/:id/resources',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(resourceSchema),
  asyncHandler(lessonController.createResource)
);

lessonRoutes.delete('/:id/resources/:resourceId',
  authMiddleware,
  asyncHandler(lessonController.deleteResource)
);
