import { resultsService } from '../services/results.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listResults = asyncHandler(async (req, res) => {
  const result = await resultsService.list(req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const getResultSummary = asyncHandler(async (req, res) => {
  const summary = await resultsService.getSummary(req.params.id, req.query);
  res.json({ success: true, data: summary });
});

export const createResult = asyncHandler(async (req, res) => {
  const item = await resultsService.create({ schoolId: req.params.id, ...req.body });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: item });
});

export const updateResult = asyncHandler(async (req, res) => {
  const item = await resultsService.update(req.params.resultId, req.body);
  if (!item) throw new AppError('Result not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  res.json({ success: true, data: item });
});

export const deleteResult = asyncHandler(async (req, res) => {
  await resultsService.delete(req.params.resultId);
  res.json({ success: true, message: 'Result deleted' });
});
