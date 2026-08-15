import { timetableService } from '../services/timetable.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listTimetables = asyncHandler(async (req, res) => {
  const result = await timetableService.list(req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const createTimetable = asyncHandler(async (req, res) => {
  const item = await timetableService.create({ schoolId: req.params.id, ...req.body });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: item });
});

export const updateTimetable = asyncHandler(async (req, res) => {
  const item = await timetableService.update(req.params.timeTableId, req.body);
  if (!item) throw new AppError('Timetable not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  res.json({ success: true, data: item });
});

export const deleteTimetable = asyncHandler(async (req, res) => {
  await timetableService.delete(req.params.timeTableId);
  res.json({ success: true, message: 'Timetable deleted' });
});
