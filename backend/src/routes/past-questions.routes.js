import { Router } from 'express';
import { validateRequest, asyncHandler, authMiddleware, requireRole } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as pastQuestionController from '../past-questions/pastQuestion.controller.js';

export const pastQuestionRoutes = Router();

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
