import { Router } from 'express';
import Joi from 'joi';
import { pool, supabaseQuery, useSupabase } from '../common/database/index.js';
import { asyncHandler, authMiddleware, authRateLimiter, validateRequest } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import { hashToken } from '../auth/utils/jwt.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../common/errors/index.js';
import * as authController from '../auth/controllers/auth.controller.js';
import * as passwordController from '../auth/controllers/password.controller.js';

export const authRoutes = Router();

// Refresh tokens are HttpOnly cookies in the browser flow. Preserve Authorization
// header support for mobile/API clients, but do not require clients to expose the
// refresh token to JavaScript when the secure cookie is available.
const refreshCookieAuth = (req, _res, next) => {
  if (!req.headers.authorization) {
    const cookieHeader = req.headers.cookie || '';
    const refreshToken = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('refresh_token='))
      ?.slice('refresh_token='.length);

    if (refreshToken) {
      req.headers.authorization = `Bearer ${decodeURIComponent(refreshToken)}`;
    }
  }
  next();
};

// The previous verification endpoint only checked the user id and then marked
// the account verified. Validate the hashed one-time token before allowing the
// controller to perform the state change.
const verifyEmailToken = asyncHandler(async (req, _res, next) => {
  const token = req.body?.token;
  const userId = req.params?.id;

  if (!token || !userId) {
    throw new AppError('Verification token is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const tokenHash = hashToken(token);
  let valid = false;

  if (!useSupabase) {
    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND is_verified = FALSE AND email_verification_token = $2',
      [userId, tokenHash]
    );
    valid = result.rows.length > 0;
  } else {
    const result = await supabaseQuery('users', {
      select: 'id',
      filters: { id: userId, is_verified: false, email_verification_token: tokenHash },
      limit: 1,
    });
    valid = Boolean(result?.rows?.length);
  }

  if (!valid) {
    throw new AppError('Invalid or expired verification token', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  next();
});

authRoutes.post('/register', authRateLimiter, validateRequest(schemas.user.register), asyncHandler(authController.register));
authRoutes.post('/login', authRateLimiter, validateRequest(schemas.user.login), asyncHandler(authController.login));
authRoutes.post('/refresh', authRateLimiter, refreshCookieAuth, asyncHandler(authController.refreshToken));
authRoutes.post('/logout', authMiddleware, asyncHandler(authController.logout));
authRoutes.post('/logout-all', authMiddleware, asyncHandler(authController.logoutAll));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));

authRoutes.post(
  '/verify-email',
  authRateLimiter,
  validateRequest({
    params: schemas.idParam,
    body: Joi.object({ token: Joi.string().min(32).max(256).required() }),
  }),
  verifyEmailToken,
  asyncHandler(authController.verifyEmail)
);
authRoutes.post('/resend-verification', authMiddleware, authRateLimiter, asyncHandler(authController.resendVerification));
authRoutes.post('/forgot-password', authRateLimiter, validateRequest(schemas.user.login.keys({ email: true })), asyncHandler(passwordController.forgotPassword));
authRoutes.post('/reset-password', authRateLimiter, validateRequest(Joi.object({ token: Joi.string().min(32).max(256).required(), password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required() })), asyncHandler(passwordController.resetPassword));
authRoutes.post('/change-password', authMiddleware, authRateLimiter, validateRequest(schemas.user.changePassword), asyncHandler(passwordController.changePassword));
