import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest } from '../common/middleware/index.js';
import * as searchController from '../search/controllers/search.controller.js';

export const searchRoutes = Router();

const searchSchema = Joi.object({
  q: Joi.string().max(200).allow('').optional(),
  type: Joi.string().valid('courses', 'lessons', 'topics', 'questions', 'exams').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

searchRoutes.get('/',
  validateRequest(searchSchema),
  asyncHandler(searchController.globalSearch)
);

searchRoutes.get('/suggestions',
  validateRequest(searchSchema),
  asyncHandler(searchController.searchSuggestions)
);
