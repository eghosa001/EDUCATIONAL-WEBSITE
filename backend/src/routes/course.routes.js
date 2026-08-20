import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as courseController from '../courses/controllers/course.controller.js';

export const courseRoutes = Router();

const sectionSchema = Joi.object({
  title: Joi.string().min(3).max(300).required(),
  description: Joi.string().optional(),
  orderIndex: Joi.number().integer().min(0).required(),
});

const sectionUpdateSchema = sectionSchema.fork(['title'], (s) => s.optional());

courseRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
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
  asyncHandler(courseController.listSavedCourses)
);

courseRoutes.post('/',
  authMiddleware,
  validateRequest(schemas.course.create),
  asyncHandler(courseController.createCourse)
);

courseRoutes.get('/:slugOrId',
  optionalAuthMiddleware,
  asyncHandler(courseController.getCourse)
);

courseRoutes.patch('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(schemas.course.update),
  asyncHandler(courseController.updateCourse)
);

courseRoutes.post('/:id/publish',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.publishCourse)
);

courseRoutes.delete('/:id',
  authMiddleware,
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
  validateRequest({ params: schemas.idParam }),
  asyncHandler(courseController.listCourseStudents)
);

courseRoutes.get('/:id/stats',
  authMiddleware,
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
  validateRequest({ params: schemas.idParam }),
  validateRequest(sectionSchema),
  asyncHandler(courseController.createSection)
);

courseRoutes.patch('/:id/sections/:sectionId',
  authMiddleware,
  validateRequest(sectionUpdateSchema),
  asyncHandler(courseController.updateSection)
);

courseRoutes.delete('/:id/sections/:sectionId',
  authMiddleware,
  asyncHandler(courseController.deleteSection)
);
