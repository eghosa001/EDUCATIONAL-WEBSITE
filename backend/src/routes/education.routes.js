import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler } from '../common/middleware/index.js';
import { validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import { authMiddleware } from '../common/middleware/index.js';
import * as educationController from '../education/controllers/education.controller.js';

export const educationRoutes = Router();

educationRoutes.use(authMiddleware);

educationRoutes.get('/systems',
  validateRequest({ query: schemas.pagination }),
  asyncHandler(educationController.listEducationSystems)
);

educationRoutes.post('/systems',
  validateRequest(Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    country: Joi.string().min(2).max(100).required(),
    description: Joi.string().optional(),
  })),
  asyncHandler(educationController.createEducationSystem)
);

educationRoutes.get('/systems/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getEducationSystem)
);

educationRoutes.get('/systems/:id/levels',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getLevels)
);

educationRoutes.post('/systems/:id/levels',
  validateRequest({ params: schemas.idParam }),
  validateRequest(Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().optional(),
    orderIndex: Joi.number().integer().min(0).required(),
    minAge: Joi.number().integer().min(0).optional(),
    maxAge: Joi.number().integer().min(0).optional(),
  })),
  asyncHandler(educationController.createLevel)
);

educationRoutes.get('/levels/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getLevel)
);

educationRoutes.get('/levels/:id/programs',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getPrograms)
);

educationRoutes.post('/levels/:id/programs',
  validateRequest({ params: schemas.idParam }),
  validateRequest(Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().optional(),
    durationYears: Joi.number().min(0.5).max(10).optional(),
    orderIndex: Joi.number().integer().min(0).required(),
  })),
  asyncHandler(educationController.createProgram)
);

educationRoutes.get('/programs/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getProgram)
);

educationRoutes.get('/programs/:id/classes',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getClasses)
);

educationRoutes.post('/programs/:id/classes',
  validateRequest({ params: schemas.idParam }),
  validateRequest(Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().optional(),
    orderIndex: Joi.number().integer().min(0).required(),
  })),
  asyncHandler(educationController.createClass)
);

educationRoutes.get('/classes/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(educationController.getClass)
);

educationRoutes.get('/terms',
  validateRequest({ query: schemas.pagination }),
  asyncHandler(educationController.listTerms)
);

educationRoutes.post('/terms',
  validateRequest(Joi.object({
    educationSystemId: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().optional(),
    orderIndex: Joi.number().integer().min(0).required(),
  })),
  asyncHandler(educationController.createTerm)
);