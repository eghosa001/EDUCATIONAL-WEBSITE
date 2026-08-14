import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as assignmentController from '../assignments/controllers/assignment.controller.js';

export const assignmentRoutes = Router();

const assignmentSchema = Joi.object({
  courseId: Joi.string().uuid().required(),
  lessonId: Joi.string().uuid().optional(),
  teacherId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(300).required(),
  description: Joi.string().optional(),
  instructions: Joi.string().optional(),
  assignmentType: Joi.string().valid('essay', 'multiple_choice', 'file_upload', 'short_answer', 'project').default('essay'),
  maxScore: Joi.number().min(0).precision(2).default(100),
  dueDate: Joi.date().required(),
  allowLateSubmission: Joi.boolean().default(false),
  latePenaltyPercent: Joi.number().min(0).max(100).precision(2).default(0),
  maxFileSizeMb: Joi.number().min(0).default(10),
  allowedFileTypes: Joi.array().items(Joi.string()).default([]),
});

const assignmentUpdateSchema = assignmentSchema.fork(
  ['courseId', 'title', 'dueDate'],
  (s) => s.optional()
).keys({ isActive: Joi.boolean().optional() });

const submitSchema = Joi.object({
  content: Joi.string().allow('').optional(),
  fileUrls: Joi.array().items(Joi.string().uri().max(500)).default([]),
});

const gradeSchema = Joi.object({
  score: Joi.number().min(0).precision(2).required(),
  feedback: Joi.string().optional(),
});

assignmentRoutes.get('/',
  optionalAuthMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(assignmentController.listAssignments)
);

assignmentRoutes.get('/my-submissions',
  authMiddleware,
  validateRequest({ query: schemas.pagination }),
  asyncHandler(assignmentController.getMySubmissions)
);

assignmentRoutes.post('/',
  authMiddleware,
  validateRequest(assignmentSchema),
  asyncHandler(assignmentController.createAssignment)
);

assignmentRoutes.get('/:id',
  optionalAuthMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(assignmentController.getAssignment)
);

assignmentRoutes.patch('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(assignmentUpdateSchema),
  asyncHandler(assignmentController.updateAssignment)
);

assignmentRoutes.delete('/:id',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(assignmentController.deleteAssignment)
);

assignmentRoutes.post('/:id/submit',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  validateRequest(submitSchema),
  asyncHandler(assignmentController.submitAssignment)
);

assignmentRoutes.get('/:id/submissions',
  authMiddleware,
  validateRequest({ params: schemas.idParam }),
  asyncHandler(assignmentController.listSubmissions)
);

assignmentRoutes.get('/:id/submissions/:submissionId',
  authMiddleware,
  asyncHandler(assignmentController.getSubmission)
);

assignmentRoutes.post('/:id/submissions/:submissionId/grade',
  authMiddleware,
  validateRequest(gradeSchema),
  asyncHandler(assignmentController.gradeSubmission)
);
