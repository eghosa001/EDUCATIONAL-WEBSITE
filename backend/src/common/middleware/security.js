import { rateLimit } from 'express-rate-limit';
import xss from 'xss';
import DOMPurify from 'dompurify';
import { config } from '../../config/index.js';

const NORMAL_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { message: 'Too many requests from this IP, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
};

const STRICT_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
};

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: { message: 'Too many authentication attempts' } },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: { message: 'Upload limit reached, please try again later' } },
});

export const securityMiddleware = {
  normalRateLimit: rateLimit(NORMAL_LIMIT),
  strictRateLimit: rateLimit(STRICT_LIMIT),
  authRateLimit: authLimiter,
  uploadRateLimit: uploadLimiter,

  sanitizeInput: (req, res, next) => {
    if (req.body) {
      for (const key of Object.keys(req.body)) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key], {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script'],
          });
        }
      }
    }
    if (req.query) {
      for (const key of Object.keys(req.query)) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = xss(req.query[key]);
        }
      }
    }
    next();
  },

  sanitizeResponse: (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (body && typeof body === 'object') {
        this.removeHeader('X-Powered-By');
        this.removeHeader('server');
      }
      return originalJson.call(this, body);
    };
    next();
  },

  hideInternalErrors: (err, req, res, next) => {
    if (err.isOperational) {
      res.status(err.statusCode || 500).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    } else {
      console.error('Internal Error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  },

  validateContentType: (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        if (!allowedTypes.some(type => contentType?.includes(type))) {
          return res.status(415).json({
            success: false,
            error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported media type' },
          });
        }
      }
      next();
    };
  },

  cors: {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 600,
  },

  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.apiBaseUrl],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.youtube.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  },

  requestId: (req, res, next) => {
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
  },

  requestTiming: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    next();
  },

  rowLevelSecurity: {
    getScope: (req, resourceType) => {
      const user = req.user;
      if (!user) return null;

      const scopes = {
        student: { userId: user.id, role: 'student' },
        teacher: { userId: user.id, role: 'teacher', canAccessCourses: ['teacher_courses'] },
        parent: { userId: user.id, role: 'parent', canAccessChildren: ['parent_children'] },
        admin: { userId: user.id, role: 'admin' },
        super_admin: { userId: user.id, role: 'super_admin' },
      };

      return scopes[user.role] || scopes.student;
    },

    applyScope: (query, scope) => {
      if (!scope) return query;

      const conditions = [];
      const values = [];

      if (scope.role === 'student' || scope.role === 'parent') {
        conditions.push(`user_id = $${values.length + 1}`);
        values.push(scope.userId);
      }

      if (scope.role === 'teacher') {
        conditions.push(`(created_by = $${values.length + 1} OR user_id = $${values.length + 2})`);
        values.push(scope.userId, scope.userId);
      }

      if (conditions.length > 0) {
        return `${query} WHERE ${conditions.join(' AND ')}`;
      }
      return query;
    },
  },
};

export default securityMiddleware;
