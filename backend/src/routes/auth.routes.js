import { Router } from 'express';
import Joi from 'joi';
import { pool } from '../common/database/index.js';
import { supabase } from '../common/supabase/index.js';
import { asyncHandler, authMiddleware, authRateLimiter, validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import { hashToken } from '../auth/utils/jwt.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../common/errors/index.js';
import * as authController from '../auth/controllers/auth.controller.js';
import * as supabaseAuthController from '../auth/controllers/supabaseAuth.controller.js';
import * as passwordController from '../auth/controllers/password.controller.js';

export const authRoutes = Router();
const useSupabaseAuth = Boolean(supabase);
const SELF_SERVICE_ROLES = new Set(['student', 'teacher', 'parent']);

const chooseAuthHandler = (legacyHandler, supabaseHandler) => (req, res, next) =>
  (useSupabaseAuth ? supabaseHandler : legacyHandler)(req, res, next);

const captureRegistrationRole = (req, _res, next) => {
  const requested = String(req.body?.role || '').trim().toLowerCase();
  req.requestedRegistrationRole = SELF_SERVICE_ROLES.has(requested) ? requested : 'student';
  next();
};

const restoreRegistrationRole = (req, _res, next) => {
  req.body.role = req.requestedRegistrationRole || 'student';
  next();
};

const refreshCookieAuth = (req, _res, next) => {
  if (!req.headers.authorization) {
    const bodyRefreshToken = req.body?.refreshToken;
    if (bodyRefreshToken) {
      req.supabaseRefreshToken = bodyRefreshToken;
      req.headers.authorization = `Bearer ${bodyRefreshToken}`;
      return next();
    }

    const cookieHeader = req.headers.cookie || '';
    const refreshToken = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('refresh_token='))
      ?.slice('refresh_token='.length);

    if (refreshToken) {
      const decoded = decodeURIComponent(refreshToken);
      req.supabaseRefreshToken = decoded;
      req.headers.authorization = `Bearer ${decoded}`;
    }
  }
  next();
};

// Local/legacy mode identifies the account by the one-time token because the
// public route has never had an :id path parameter. Supabase mode validates the
// token through GoTrue in the selected controller instead.
const prepareLegacyVerification = asyncHandler(async (req, _res, next) => {
  if (useSupabaseAuth) return next();
  const tokenHash = hashToken(req.body.token);
  const result = await pool.query(
    'SELECT id FROM users WHERE is_verified = FALSE AND email_verification_token = $1 LIMIT 1',
    [tokenHash]
  );
  if (!result.rows.length) {
    throw new AppError('Invalid or expired verification token', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  req.params.id = result.rows[0].id;
  next();
});

authRoutes.post(
  '/register',
  authRateLimiter,
  captureRegistrationRole,
  validateRequest(schemas.user.register),
  restoreRegistrationRole,
  asyncHandler(chooseAuthHandler(authController.register, supabaseAuthController.registerWithSupabase))
);
authRoutes.post('/login', authRateLimiter, validateRequest(schemas.user.login), asyncHandler(chooseAuthHandler(authController.login, supabaseAuthController.loginWithSupabase)));
authRoutes.post('/refresh', authRateLimiter, refreshCookieAuth, asyncHandler(chooseAuthHandler(authController.refreshToken, supabaseAuthController.refreshWithSupabase)));
authRoutes.post('/logout', authMiddleware, asyncHandler(chooseAuthHandler(authController.logout, supabaseAuthController.logoutWithSupabase)));
authRoutes.post('/logout-all', authMiddleware, asyncHandler(chooseAuthHandler(authController.logoutAll, supabaseAuthController.logoutAllWithSupabase)));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));

authRoutes.post(
  '/verify-email',
  authRateLimiter,
  validateRequest(Joi.object({ token: Joi.string().min(32).max(512).required() })),
  prepareLegacyVerification,
  asyncHandler(chooseAuthHandler(authController.verifyEmail, supabaseAuthController.verifyEmailWithSupabase))
);

if (useSupabaseAuth) {
  authRoutes.post(
    '/resend-verification',
    authRateLimiter,
    validateRequest(Joi.object({ email: Joi.string().email().required() })),
    asyncHandler(supabaseAuthController.resendVerificationWithSupabase)
  );
} else {
  authRoutes.post('/resend-verification', authMiddleware, authRateLimiter, asyncHandler(authController.resendVerification));
}

authRoutes.post('/forgot-password', authRateLimiter, validateRequest(Joi.object({ email: Joi.string().email().required() })), asyncHandler(passwordController.forgotPassword));
authRoutes.post('/reset-password', authRateLimiter, validateRequest(Joi.object({ token: Joi.string().min(32).max(256).required(), password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required() })), asyncHandler(passwordController.resetPassword));
authRoutes.post('/change-password', authMiddleware, authRateLimiter, validateRequest(schemas.user.changePassword), asyncHandler(passwordController.changePassword));
