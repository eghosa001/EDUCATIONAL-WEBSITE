import { classesService } from '../services/classes.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listClasses = asyncHandler(async (req, res) => {
  const result = await classesService.list(req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const createClass = asyncHandler(async (req, res) => {
  const item = await classesService.create(req.params.id, req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: item });
});

export const updateClass = asyncHandler(async (req, res) => {
  const item = await classesService.update(req.params.classId, req.body);
  if (!item) throw new AppError('Class not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  res.json({ success: true, data: item });
});

export const deleteClass = asyncHandler(async (req, res) => {
  await classesService.delete(req.params.classId);
  res.json({ success: true, message: 'Class deleted' });
});

export const getStudentsByClass = asyncHandler(async (req, res) => {
  const students = await classesService.getStudentsByClass(req.params.id, req.params.classId);
  res.json({ success: true, data: students });
});
