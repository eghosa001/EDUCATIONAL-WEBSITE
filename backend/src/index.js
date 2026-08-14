import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './common/config/index.js';
import { errorHandler, notFoundHandler, corsOptions, requestLogger, rateLimiter } from './common/middleware/index.js';
import { apiRoutes } from './routes/api.routes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (config.env !== 'test') {
  app.use(morgan('combined'));
}

app.use(requestLogger);
app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Educational Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
  });
});

app.use(config.apiPrefix, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.env} mode`);
      console.log(`API available at http://localhost:${config.port}${config.apiPrefix}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;