import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as courseController from '../courses/controllers/course.controller.js';

export const courseRoutes = Router();
const courseManager = requireRole('teacher', 'content_admin', 'super_admin');
const sectionParams = Joi.object({ id: Joi.string().uuid().required(), sectionId: Joi.string().uuid().required() });

const courseListQuery = schemas.pagination.keys({
  status: Joi.string().valid('draft', 'pending_review', 'approved', 'published', 'archived', 'rejected').optional(),
  subjectId: Joi.string().uuid().optional(),
  classId: Joi.string().uuid().optional(),
  teacherId: Joi.string().uuid().optional(),
  featured: Joi.boolean().optional(),
});

const sectionSchema = Joi.object({
  title: Joi.string().min(3).max(300).required(),
  description: Joi.string().optional(),
  orderIndex: Joi.number().integer().min(0).required(),
});

const sectionUpdateSchema = sectionSchema.fork(['title'], (s) => s.optional());

courseRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: courseListQuery }),
  asyncHandler(courseController.listCourses)
);

courseRoutes.get('/featured',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(courseController.listFeaturedCourses)
);

courseRoutes.get('/my',
  authMiddleware,
  asyncHandler(courseController.listMyCourses)
);

courseRoutes.get('/saved',
  authMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(courseController.listSavedCourses)
);

courseRoutes.post('/',
  authMiddleware,
  courseManager,
  validateRequest(schemas.course.create),
  asyncHandler(courseController.createCourse)
);

courseRoutes.get('/:slugOrId',
  optionalAuthMiddleware,
  asyncHandler(courseController.getCourse)
);

courseRoutes.patch('/:id',
  authMiddleware,
  courseManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest(schemas.course.update),
  asyncHandler(courseController.updateCourse)
);

courseRoutes.post('/:id/publish',
  authMiddleware,
  courseManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.publishCourse)
);

courseRoutes.delete('/:id',
  authMiddleware,
  courseManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.deleteCourse)
);

courseRoutes.post('/:id/enroll',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.enrollCourse)
);

courseRoutes.delete('/:id/enroll',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.unenrollCourse)
);

courseRoutes.get('/:id/students',
  authMiddleware,
  courseManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.listCourseStudents)
);

courseRoutes.get('/:id/stats',
  authMiddleware,
  courseManager,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.getCourseStats)
);

courseRoutes.get('/:id/lessons',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.listCourseLessons)
);

courseRoutes.post('/:id/sections',
  authMiddleware,
  courseManager,
  validateRequest({ params: schemas.idParam }),
  validateRequest(sectionSchema),
  asyncHandler(courseController.createSection)
);

courseRoutes.patch('/:id/sections/:sectionId',
  authMiddleware,
  courseManager,
  validateRequest({ params: sectionParams }),
  validateRequest(sectionUpdateSchema),
  asyncHandler(courseController.updateSection)
);

courseRoutes.delete('/:id/sections/:sectionId',
  authMiddleware,
  courseManager,
  validateRequest({ params: sectionParams }),
  asyncHandler(courseController.deleteSection)
);
