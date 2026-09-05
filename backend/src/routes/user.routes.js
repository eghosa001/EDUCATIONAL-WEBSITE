import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler } from '../common/middleware/index.js';
import { validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import { authMiddleware } from '../common/middleware/index.js';
import * as userController from '../users/controllers/user.controller.js';

export const userRoutes = Router();

userRoutes.use(authMiddleware);

userRoutes.get('/',
  validateRequest({ query: schemas.pagination }),
  asyncHandler(userController.listUsers)
);

userRoutes.get('/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(userController.getUserById)
);

userRoutes.patch('/:id',
  validateRequest({ params: schemas.idParam }),
  validateRequest(schemas.user.updateProfile),
  asyncHandler(userController.updateUser)
);

userRoutes.delete('/:id',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(userController.deleteUser)
);

userRoutes.get('/:id/profile',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(userController.getUserProfile)
);

userRoutes.patch('/:id/profile',
  validateRequest({ params: schemas.idParam }),
  validateRequest(schemas.user.updateProfile),
  asyncHandler(userController.updateProfile)
);

userRoutes.get('/:id/courses',
  validateRequest({ params: schemas.idParam }),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(userController.getUserCourses)
);

userRoutes.get('/:id/progress',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(userController.getUserProgress)
);

userRoutes.get('/:id/achievements',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(userController.getUserAchievements)
);

userRoutes.post('/:id/roles',
  validateRequest({ params: schemas.idParam }),
  validateRequest(Joi.object({
    roleId: Joi.string().uuid().required(),
  })),
  asyncHandler(userController.assignRole)
);

userRoutes.delete('/:id/roles/:roleId',
  validateRequest({ params: Joi.object({
    id: Joi.string().uuid().required(),
    roleId: Joi.string().uuid().required(),
  }) }),
  asyncHandler(userController.removeRole)
);
