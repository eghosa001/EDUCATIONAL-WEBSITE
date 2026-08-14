import { config } from '../config/index.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
import { AppError, handleError, asyncHandler } from '../errors/index.js';
import { rateLimit } from 'express-rate-limit';

export { asyncHandler, AppError }; 

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
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No token provided', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const token = authHeader.split(' ')[1];

  try {
    const { verifyToken } = await import('../../auth/utils/jwt.js');
    const decoded = verifyToken(token);

    const { getUserById } = await import('../../users/services/user.service.js');
    const user = await getUserById(decoded.sub);

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
});

export const optionalAuthMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const { verifyToken } = await import('../../auth/utils/jwt.js');
    const decoded = verifyToken(token);

    const { getUserById } = await import('../../users/services/user.service.js');
    const user = await getUserById(decoded.sub);

    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
  } catch {
  }

  next();
});

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    if (!roles.includes(req.user.role)) {
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

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

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