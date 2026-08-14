import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as curriculumController from '../curriculum/controllers/curriculum.controller.js';

export const curriculumRoutes = Router();

const subjectSchema = Joi.object({
  educationSystemId: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(1).max(20).required(),
  description: Joi.string().optional(),
  icon: Joi.string().max(100).optional(),
  color: Joi.string().max(20).optional(),
  orderIndex: Joi.number().integer().min(0).default(0),
  isCore: Joi.boolean().default(false),
});

const subjectUpdateSchema = subjectSchema.fork(
  ['educationSystemId', 'name', 'code'],
  (s) => s.optional()
).keys({ isActive: Joi.boolean().optional() });

const topicSchema = Joi.object({
  subjectId: Joi.string().uuid().required(),
  classId: Joi.string().uuid().optional(),
  termId: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(1).max(20).required(),
  description: Joi.string().optional(),
  learningObjectives: Joi.array().items(Joi.string()).default([]),
  orderIndex: Joi.number().integer().min(0).default(0),
  estimatedHours: Joi.number().min(0).optional(),
});

const topicUpdateSchema = topicSchema.fork(
  ['subjectId', 'code', 'name'],
  (s) => s.optional()
).keys({ isActive: Joi.boolean().optional() });

const subtopicSchema = Joi.object({
  topicId: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(1).max(20).required(),
  description: Joi.string().optional(),
  learningObjectives: Joi.array().items(Joi.string()).default([]),
  orderIndex: Joi.number().integer().min(0).default(0),
  estimatedHours: Joi.number().min(0).optional(),
});

const subtopicUpdateSchema = subtopicSchema.fork(
  ['topicId', 'code', 'name'],
  (s) => s.optional()
).keys({ isActive: Joi.boolean().optional() });

curriculumRoutes.get('/education-systems',
  asyncHandler(curriculumController.listEducationSystems)
);

curriculumRoutes.get('/education-levels',
  asyncHandler(curriculumController.listEducationLevels)
);

curriculumRoutes.get('/tree',
  asyncHandler(curriculumController.getCurriculumTree)
);

curriculumRoutes.get('/subjects',
  validateRequest({ query: schemas.pagination }),
  asyncHandler(curriculumController.listSubjects)
);

curriculumRoutes.post('/subjects',
  authMiddleware,
  validateRequest(subjectSchema),
  asyncHandler(curriculumController.createSubject)
);

curriculumRoutes.get('/subjects/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(curriculumController.getSubject)
);

curriculumRoutes.patch('/subjects/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(subjectUpdateSchema),
  asyncHandler(curriculumController.updateSubject)
);

curriculumRoutes.delete('/subjects/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(curriculumController.deleteSubject)
);

curriculumRoutes.get('/topics',
  validateRequest({ query: schemas.pagination }),
  asyncHandler(curriculumController.listTopics)
);

curriculumRoutes.post('/topics',
  authMiddleware,
  validateRequest(topicSchema),
  asyncHandler(curriculumController.createTopic)
);

curriculumRoutes.get('/topics/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(curriculumController.getTopic)
);

curriculumRoutes.patch('/topics/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(topicUpdateSchema),
  asyncHandler(curriculumController.updateTopic)
);

curriculumRoutes.delete('/topics/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(curriculumController.deleteTopic)
);

curriculumRoutes.get('/subtopics',
  asyncHandler(curriculumController.listSubtopics)
);

curriculumRoutes.post('/subtopics',
  authMiddleware,
  validateRequest(subtopicSchema),
  asyncHandler(curriculumController.createSubtopic)
);

curriculumRoutes.get('/subtopics/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(curriculumController.getSubtopic)
);

curriculumRoutes.patch('/subtopics/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(subtopicUpdateSchema),
  asyncHandler(curriculumController.updateSubtopic)
);

curriculumRoutes.delete('/subtopics/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(curriculumController.deleteSubtopic)
);
