import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as storageController from '../storage/controllers/storage.controller.js';

export const storageRoutes = Router();

storageRoutes.use(authMiddleware);

storageRoutes.post('/upload', asyncHandler(storageController.uploadFile));
storageRoutes.delete('/:key', asyncHandler(storageController.deleteFile));
storageRoutes.get('/files/:key', asyncHandler(storageController.getFile));