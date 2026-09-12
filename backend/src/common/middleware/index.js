import { config } from '../config/index.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
import { AppError, handleError, asyncHandler } from '../errors/index.js';
import { rateLimit } from 'express-rate-limit';

export { asyncHandler, AppError };
import subscriptionMiddleware from './subscription.js';
export const requireSubscription = subscriptionMiddleware.requireSubscription;
export const requireFeatureAccess = subscriptionMiddleware.requireFeatureAccess;

/** Parse cookies from the Cookie request header (no cookie-parser dependency). */
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((c) => {
    const [name, ...rest] = c.trim().split('=');
    cookies[name] = rest.join('=');
  });
  return cookies;
};

const getRequestToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();
  const cookies = parseCookies(req.headers.cookie);
  return cookies.access_token || null;
};

/**
 * Verify either the platform's legacy API JWT or a Supabase Auth access token.
 * Both paths verify signatures/expiry; Supabase tokens are never trusted by
 * decoding them locally without verification.
 */
const verifyIdentityToken = async (token) => {
  try {
    const { verifyToken } = await import('../../auth/utils/jwt.js');
    const decoded = verifyToken(token);
    if (decoded?.sub) return { userId: decoded.sub, provider: 'platform' };
  } catch {
    // The admin/web clients may use a Supabase Auth session instead.
  }

  const { supabaseAdmin, supabase } = await import('../supabase/index.js');
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error('Supabase authentication is not configured');
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) throw new Error('Invalid Supabase session');
  return { userId: data.user.id, provider: 'supabase' };
};

const loadAuthenticatedUser = async (token) => {
  const identity = await verifyIdentityToken(token);
  const userService = await import('../../users/services/user.service.js');
  const user = await userService.default.getUserById(identity.userId);
  if (!user || !user.is_active) {
    throw new AppError('User not found or inactive', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
  return { user, provider: identity.provider };
};

export const errorHandler = (err, req, res, next) => {
  handleError(err, res);
};

export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) {
    throw new AppError('No token provided', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  try {
    const { user, provider } = await loadAuthenticatedUser(token);
    req.user = user;
    req.token = token;
    req.authProvider = provider;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
});

export const optionalAuthMiddleware = asyncHandler(async (req, res, next) => {
  const token = getRequestToken(req);
  if (token) {
    try {
      const { user, provider } = await loadAuthenticatedUser(token);
      req.user = user;
      req.token = token;
      req.authProvider = provider;
    } catch {
      // Invalid or expired token — proceed unauthenticated.
    }
  }
  next();
});

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    const userRoles = new Set([req.user.role, ...(req.user.roles || [])].filter(Boolean));
    if (!roles.some((role) => userRoles.has(role))) {
      throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
    }

    next();
  };
};

export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasPermission = userPermissions.includes('*') || permissions.some((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
    }

    next();
  };
};

export const validateRequest = (schemaOrMap) => {
  return asyncHandler(async (req, res, next) => {
    try {
      const { validate } = await import('../validators/joi.js');

      const locations = schemaOrMap && typeof schemaOrMap.validate === 'function'
        ? { body: schemaOrMap }
        : schemaOrMap || {};

      if (locations.body) req.body = await validate(locations.body, req.body);
      if (locations.query) req.query = await validate(locations.query, req.query);
      if (locations.params) req.params = await validate(locations.params, req.params);

      next();
    } catch (error) {
      throw new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, error.details);
    }
  });
};

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 900000,
  max: 10,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

export const corsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
};