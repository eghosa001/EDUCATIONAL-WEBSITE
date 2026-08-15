import { feesService } from '../services/fees.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listFees = asyncHandler(async (req, res) => {
  const result = await feesService.list(req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const getFeeSummary = asyncHandler(async (req, res) => {
  const summary = await feesService.getSummary(req.params.id, req.query);
  res.json({ success: true, data: summary });
});

export const createFee = asyncHandler(async (req, res) => {
  const item = await feesService.create({ schoolId: req.params.id, ...req.body });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: item });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const item = await feesService.recordPayment(req.params.feeId, req.body);
  res.json({ success: true, data: item });
});

export const updateFee = asyncHandler(async (req, res) => {
  const item = await feesService.update(req.params.feeId, req.body);
  if (!item) throw new AppError('Fee record not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  res.json({ success: true, data: item });
});

export const deleteFee = asyncHandler(async (req, res) => {
  await feesService.delete(req.params.feeId);
  res.json({ success: true, message: 'Fee record deleted' });
});
