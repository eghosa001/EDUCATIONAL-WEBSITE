import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, authMiddleware, authRateLimiter, validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as authController from '../auth/controllers/auth.controller.js';
import * as passwordController from '../auth/controllers/password.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, validateRequest(schemas.user.register), asyncHandler(authController.register));
authRoutes.post('/login', authRateLimiter, validateRequest(schemas.user.login), asyncHandler(authController.login));
authRoutes.post('/refresh', authRateLimiter, asyncHandler(authController.refreshToken));
authRoutes.post('/logout', authMiddleware, asyncHandler(authController.logout));
authRoutes.post('/logout-all', authMiddleware, asyncHandler(authController.logoutAll));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));

authRoutes.post('/verify-email', authRateLimiter, validateRequest({ params: schemas.idParam }), asyncHandler(authController.verifyEmail));
authRoutes.post('/resend-verification', authMiddleware, authRateLimiter, asyncHandler(authController.resendVerification));
authRoutes.post('/forgot-password', authRateLimiter, validateRequest(schemas.user.login.keys({ email: true })), asyncHandler(passwordController.forgotPassword));
authRoutes.post('/reset-password', authRateLimiter, validateRequest(Joi.object({ token: Joi.string().min(32).max(256).required(), password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required() })), asyncHandler(passwordController.resetPassword));
authRoutes.post('/change-password', authMiddleware, authRateLimiter, validateRequest(schemas.user.changePassword), asyncHandler(passwordController.changePassword));
