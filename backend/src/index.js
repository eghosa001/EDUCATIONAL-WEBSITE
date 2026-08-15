'use strict';

// External packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

// Database
const { pool, query, getClient, transaction } = require('./common/database');

// Constants
const { HTTP_STATUS, ERROR_CODES } = require('./common/constants');

// Errors
const { AppError, handleError, asyncHandler } = require('./common/errors');

// Config
const { config } = require('./common/config');

// Middleware
const {
  errorHandler,
  notFoundHandler,
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePermission,
  validateRequest,
  rateLimiter,
  authRateLimiter,
  corsOptions,
  requestLogger,
} = require('./common/middleware');

// Services
const flashcardService = require('./flashcards/services/flashcard.service');
const pastQuestionService = require('./past-questions/services/pastQuestion.service');
const assessmentEngine = require('./assessments/engine');
const contentApprovalService = require('./administration/services/workflow.service');
const notificationDispatcher = require('./notifications/dispatch.service');
const aiTutorService = require('./ai/tutor.service');
const liveClassService = require('./live-classes/services/liveClass.service');
const searchIndexer = require('./search/indexer');
const certificateService = require('./certificates/generator');
const moderationService = require('./community/moderation.service');
const securityMiddleware = require('./common/middleware/security');

// Routes
const { apiRoutes } = require('./routes/api.routes');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

app.use(requestLogger);
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Educational Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
  });
});

// API routes
app.use(config.apiPrefix, apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.env} mode`);
      console.log(`API available at http://localhost:${config.port}${config.apiPrefix}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = app;
