import { Router } from 'express';
import { asyncHandler, authMiddleware, requireRole } from '../common/middleware/index.js';
import * as storageController from '../storage/controllers/storage.controller.js';

export const storageRoutes = Router();
storageRoutes.use(authMiddleware);

storageRoutes.post('/upload', asyncHandler(storageController.uploadFile));
// File ownership is not currently persisted, so only super admins may delete by key.
storageRoutes.delete('/:key', requireRole('super_admin'), asyncHandler(storageController.deleteFile));
storageRoutes.get('/files/:key', asyncHandler(storageController.getFile));
