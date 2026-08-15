import { Router } from 'express';
import Joi from 'joi';
import { validateRequest, asyncHandler, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as liveClassController from '../live-classes/liveClass.controller.js';
import { requireRole } from '../common/middleware/index.js';

export const liveClassRoutes = Router();

const liveClassCreateSchema = {
  title: Joi.string().min(3).max(300).required(),
  description: Joi.string().optional(),
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  scheduledAt: Joi.date().min('now').required(),
  durationMinutes: Joi.number().integer().min(1).max(600).required(),
  maxParticipants: Joi.number().integer().min(1).optional(),
  meetingUrl: Joi.string().uri().max(500).required(),
};

liveClassRoutes.get('/',
  asyncHandler(liveClassController.listClasses)
);

liveClassRoutes.get('/my',
  authMiddleware,
  asyncHandler(liveClassController.getMyClasses)
);

liveClassRoutes.get('/upcoming',
  authMiddleware,
  asyncHandler(liveClassController.getUpcomingClasses)
);

liveClassRoutes.get('/:id',
  asyncHandler(liveClassController.getClass)
);

liveClassRoutes.post('/',
  authMiddleware,
  asyncHandler(liveClassController.createClass)
);

liveClassRoutes.patch('/:id',
  authMiddleware,
  requireRole('teacher', 'super_admin', 'content_admin'),
  asyncHandler(liveClassController.updateClass)
);

liveClassRoutes.delete('/:id',
  authMiddleware,
  requireRole('teacher', 'super_admin', 'content_admin'),
  asyncHandler(liveClassController.deleteClass)
);

liveClassRoutes.post('/:id/join',
  authMiddleware,
  asyncHandler(liveClassController.joinClass)
);

liveClassRoutes.delete('/:id/leave',
  authMiddleware,
  asyncHandler(liveClassController.leaveClass)
);

liveClassRoutes.post('/:id/end',
  authMiddleware,
  requireRole('teacher', 'super_admin'),
  asyncHandler(liveClassController.endClass)
);

liveClassRoutes.get('/:id/participants',
  authMiddleware,
  asyncHandler(liveClassController.getClassParticipants)
);

liveClassRoutes.patch('/:id/attendance',
  authMiddleware,
  asyncHandler(liveClassController.markAttendance)
);

liveClassRoutes.get('/:id/analytics',
  authMiddleware,
  requireRole('teacher', 'super_admin'),
  asyncHandler(liveClassController.getClassAnalytics)
);
