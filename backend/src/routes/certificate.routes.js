import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../common/middleware/index.js';
import * as certificateController from '../certificates/controllers/certificate.controller.js';

export const certificateRoutes = Router();

certificateRoutes.get('/my',
  authMiddleware,
  asyncHandler(certificateController.getMyCertificates)
);

certificateRoutes.get('/:certificateId',
  asyncHandler(certificateController.getCertificate)
);

certificateRoutes.post('/generate/:courseId',
  authMiddleware,
  asyncHandler(certificateController.generateCertificate)
);
