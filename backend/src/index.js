// External packages
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import xss from 'xss';

// Database
import { pool, query, getClient, transaction } from './common/database/index.js';

// Constants
import { HTTP_STATUS, ERROR_CODES } from './common/constants/index.js';

// Errors
import { AppError, handleError, asyncHandler } from './common/errors/index.js';

// Config
import { config } from './common/config/index.js';

// Middleware
import {
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
} from './common/middleware/index.js';

// Services
import flashcardService from './flashcards/services/flashcard.service.js';
import pastQuestionService from './past-questions/services/pastQuestion.service.js';
import assessmentEngine from './assessments/engine.js';
import contentApprovalService from './administration/services/workflow.service.js';
import notificationDispatcher from './notifications/dispatch.service.js';
import aiTutorService from './ai/tutor.service.js';
import liveClassService from './live-classes/services/liveClass.service.js';
import searchIndexer from './search/indexer.js';
import certificateService from './certificates/generator.js';
import moderationService from './community/moderation.service.js';
import securityMiddleware from './common/middleware/security.js';

// Routes
import { apiRoutes } from './routes/api.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (config.env !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);
app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Educational Platform API is running', timestamp: new Date().toISOString(), version: '1.0.0', environment: config.env });
});

app.use(config.apiPrefix, apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => { pool.end(); process.exit(0); });
process.on('SIGINT', () => { pool.end(); process.exit(0); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); });
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); process.exit(1); });

startServer();
