import { Router } from 'express';
import { validateRequest, asyncHandler } from '../../common/middleware/index.js';
import { schemas } from '../../common/validators/joi.js';
import * as schoolController from '../controllers/school.controller.js';
import { requireRole } from '../../common/middleware/index.js';

export const schoolRoutes = Router();

schoolRoutes.get('/',
  asyncHandler(schoolController.listSchools)
);

schoolRoutes.get('/:id',
  asyncHandler(schoolController.getSchoolById)
);

schoolRoutes.post('/',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.createSchool)
);

schoolRoutes.patch('/:id',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.updateSchool)
);

schoolRoutes.delete('/:id',
  requireRole('super_admin'),
  asyncHandler(schoolController.deleteSchool)
);

schoolRoutes.get('/:id/stats',
  asyncHandler(schoolController.getSchoolStats)
);

schoolRoutes.post('/join',
  asyncHandler(schoolController.joinSchool)
);

schoolRoutes.post('/:id/students',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.addStudent)
);

schoolRoutes.delete('/:id/students/:studentId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.removeStudent)
);
