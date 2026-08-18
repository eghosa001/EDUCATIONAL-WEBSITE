import { Router } from 'express';
import { validateRequest, asyncHandler, authMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as pastQuestionController from '../past-questions/pastQuestion.controller.js';
import * as pastQuestionFileController from '../past-questions/controllers/pastQuestionFile.controller.js';

export const pastQuestionRoutes = Router();

// File browsing routes (new)
pastQuestionRoutes.get('/files',
  asyncHandler(pastQuestionFileController.listFiles)
);

pastQuestionRoutes.get('/files/stats',
  asyncHandler(pastQuestionFileController.getStats)
);

pastQuestionRoutes.get('/files/boards',
  asyncHandler(pastQuestionFileController.getBoards)
);

pastQuestionRoutes.get('/files/boards/:board',
  asyncHandler(pastQuestionFileController.listFilesByBoard)
);

pastQuestionRoutes.get('/files/boards/:board/subjects',
  asyncHandler(pastQuestionFileController.getSubjectsByBoard)
);

pastQuestionRoutes.get('/files/boards/:board/years',
  asyncHandler(pastQuestionFileController.getYearsByBoard)
);

pastQuestionRoutes.get('/files/:id',
  asyncHandler(pastQuestionFileController.getFile)
);

pastQuestionRoutes.patch('/files/:id/process',
  authMiddleware,
  requireRole('super_admin', 'content_admin'),
  asyncHandler(pastQuestionFileController.markProcessed)
);

// Question routes (existing)
pastQuestionRoutes.get('/boards',
  asyncHandler(pastQuestionController.getBoards)
);

pastQuestionRoutes.get('/',
  asyncHandler(pastQuestionController.listQuestions)
);

pastQuestionRoutes.get('/:id',
  asyncHandler(pastQuestionController.getQuestion)
);

pastQuestionRoutes.get('/boards/:board/stats',
  asyncHandler(pastQuestionController.getBoardStats)
);

pastQuestionRoutes.get('/boards/:board/topics',
  asyncHandler(pastQuestionController.getTopicsByBoard)
);

pastQuestionRoutes.get('/boards/:board/years',
  asyncHandler(pastQuestionController.getYearsByBoard)
);

pastQuestionRoutes.get('/boards/:board/questions',
  asyncHandler(pastQuestionController.listByBoard)
);

pastQuestionRoutes.get('/subjects/:subjectId/questions',
  asyncHandler(pastQuestionController.listBySubject)
);

pastQuestionRoutes.get('/boards/:board/practice',
  asyncHandler(pastQuestionController.getPracticeQuestions)
);

pastQuestionRoutes.get('/boards/:board/timed-test',
  asyncHandler(pastQuestionController.generateTimedTest)
);

pastQuestionRoutes.get('/boards/:board/analytics',
  asyncHandler(pastQuestionController.getAnalytics)
);

pastQuestionRoutes.post('/',
  authMiddleware,
  requireRole('teacher', 'super_admin', 'content_admin'),
  asyncHandler(pastQuestionController.createQuestion)
);

pastQuestionRoutes.post('/bulk-import',
  authMiddleware,
  requireRole('teacher', 'super_admin', 'content_admin'),
  asyncHandler(pastQuestionController.bulkImport)
);

pastQuestionRoutes.patch('/:id',
  authMiddleware,
  requireRole('teacher', 'super_admin', 'content_admin'),
  asyncHandler(pastQuestionController.updateQuestion)
);

pastQuestionRoutes.delete('/:id',
  authMiddleware,
  requireRole('teacher', 'super_admin', 'content_admin'),
  asyncHandler(pastQuestionController.deleteQuestion)
);
