import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler } from '../common/middleware/index.js';
import { authRateLimiter } from '../common/middleware/index.js';
import { validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as authController from '../auth/controllers/auth.controller.js';
import * as passwordController from '../auth/controllers/password.controller.js';

export const authRoutes = Router();

authRoutes.post('/register',
  authRateLimiter,
  validateRequest(schemas.user.register),
  asyncHandler(authController.register)
);

authRoutes.post('/login',
  authRateLimiter,
  validateRequest(schemas.user.login),
  asyncHandler(authController.login)
);

authRoutes.post('/refresh',
  asyncHandler(authController.refreshToken)
);

authRoutes.post('/logout',
  asyncHandler(authController.logout)
);

authRoutes.post('/logout-all',
  asyncHandler(authController.logoutAll)
);

authRoutes.get('/me',
  asyncHandler(authController.getCurrentUser)
);

authRoutes.post('/verify-email',
  validateRequest({ params: schemas.idParam }),
  asyncHandler(authController.verifyEmail)
);

authRoutes.post('/resend-verification',
  asyncHandler(authController.resendVerification)
);

authRoutes.post('/forgot-password',
  validateRequest(schemas.user.login.keys({ email: true })),
  asyncHandler(passwordController.forgotPassword)
);

authRoutes.post('/reset-password',
  validateRequest(Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  })),
  asyncHandler(passwordController.resetPassword)
);

authRoutes.post('/change-password',
  validateRequest(schemas.user.changePassword),
  asyncHandler(passwordController.changePassword)
);