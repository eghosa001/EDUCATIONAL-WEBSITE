import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as lessonController from '../lessons/controllers/lesson.controller.js';

export const lessonRoutes = Router();
const lessonManager = requireRole('teacher', 'content_admin', 'super_admin');
const resourceParams = Joi.object({ id: Joi.string().uuid().required(), resourceId: Joi.string().uuid().required() });
const lessonListQuery = schemas.pagination.keys({
  courseId: Joi.string().uuid().optional(),
  sectionId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  isPublished: Joi.boolean().optional(),
});

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

lessonRoutes.get('/', optionalAuthMiddleware, validateRequest({ query: lessonListQuery }), asyncHandler(lessonController.listLessons));
lessonRoutes.post('/', authMiddleware, lessonManager, validateRequest(schemas.lesson.create), asyncHandler(lessonController.createLesson));
lessonRoutes.get('/:slugOrId', optionalAuthMiddleware, asyncHandler(lessonController.getLesson));
lessonRoutes.patch('/:id', authMiddleware, lessonManager, validateRequest({ params: schemas.idParam }), validateRequest(schemas.lesson.update), asyncHandler(lessonController.updateLesson));
lessonRoutes.post('/:id/publish', authMiddleware, lessonManager, validateRequest({ params: schemas.idParam }), asyncHandler(lessonController.publishLesson));
lessonRoutes.post('/:id/complete', authMiddleware, validateRequest({ params: schemas.idParam }), asyncHandler(lessonController.completeLesson));
lessonRoutes.delete('/:id', authMiddleware, lessonManager, validateRequest({ params: schemas.idParam }), asyncHandler(lessonController.deleteLesson));
lessonRoutes.get('/:id/resources', authMiddleware, validateRequest({ params: schemas.idParam }), asyncHandler(lessonController.listResources));
lessonRoutes.post('/:id/resources', authMiddleware, lessonManager, validateRequest({ params: schemas.idParam }), validateRequest(resourceSchema), asyncHandler(lessonController.createResource));
lessonRoutes.delete('/:id/resources/:resourceId', authMiddleware, lessonManager, validateRequest({ params: resourceParams }), asyncHandler(lessonController.deleteResource));
