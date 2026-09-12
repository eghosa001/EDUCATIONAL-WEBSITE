import { Router } from 'express';
import Joi from 'joi';
import { validateRequest, asyncHandler, authMiddleware, optionalAuthMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as liveClassController from '../live-classes/liveClass.controller.js';

export const liveClassRoutes = Router();
const liveClassManager = requireRole('teacher', 'content_admin', 'super_admin');

const liveClassCreateSchema = Joi.object({
  title: Joi.string().min(3).max(300).required(),
  description: Joi.string().allow('').optional(),
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  scheduledAt: Joi.date().min('now').required(),
  durationMinutes: Joi.number().integer().min(1).max(600).required(),
  maxParticipants: Joi.number().integer().min(1).max(10000).optional(),
  meetingUrl: Joi.string().uri().max(500).required(),
});
const liveClassUpdateSchema = liveClassCreateSchema.fork(['title', 'scheduledAt', 'durationMinutes', 'meetingUrl'], (schema) => schema.optional()).keys({
  status: Joi.string().valid('scheduled', 'live', 'ended', 'cancelled').optional(),
});
const liveClassListQuery = schemas.pagination.keys({
  status: Joi.string().valid('scheduled', 'live', 'ended', 'cancelled').optional(),
  subjectId: Joi.string().uuid().optional(),
  teacherId: Joi.string().uuid().optional(),
});
const attendanceSchema = Joi.object({ status: Joi.string().valid('joined', 'attended', 'left').required() });

liveClassRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: liveClassListQuery }),
  asyncHandler(liveClassController.listClasses)
);

liveClassRoutes.get('/my',
  authMiddleware,
  liveClassManager,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(liveClassController.getMyClasses)
);

liveClassRoutes.get('/upcoming',
  authMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(liveClassController.getUpcomingClasses)
);

liveClassRoutes.get('/:id',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.getClass)
);

liveClassRoutes.post('/',
  authMiddleware,
  liveClassManager,
  validateRequest(liveClassCreateSchema),
  asyncHandler(liveClassController.createClass)
);

liveClassRoutes.patch('/:id',
  authMiddleware,
  liveClassManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest(liveClassUpdateSchema),
  asyncHandler(liveClassController.updateClass)
);

liveClassRoutes.delete('/:id',
  authMiddleware,
  liveClassManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.deleteClass)
);

liveClassRoutes.post('/:id/join',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.joinClass)
);

liveClassRoutes.delete('/:id/leave',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.leaveClass)
);

liveClassRoutes.post('/:id/end',
  authMiddleware,
  liveClassManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.endClass)
);

liveClassRoutes.get('/:id/participants',
  authMiddleware,
  liveClassManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.getClassParticipants)
);

liveClassRoutes.patch('/:id/attendance',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(attendanceSchema),
  asyncHandler(liveClassController.markAttendance)
);

liveClassRoutes.get('/:id/analytics',
  authMiddleware,
  liveClassManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(liveClassController.getClassAnalytics)
);
