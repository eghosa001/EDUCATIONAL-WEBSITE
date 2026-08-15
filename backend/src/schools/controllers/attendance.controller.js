import { attendanceService } from '../services/attendance.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.list(req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const getAttendanceStats = asyncHandler(async (req, res) => {
  const stats = await attendanceService.getStats(req.params.id, req.query.classId, req.query.startDate, req.query.endDate);
  res.json({ success: true, data: stats });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const item = await attendanceService.markAttendance({ schoolId: req.params.id, ...req.body });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: item });
});

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const results = await attendanceService.bulkMarkAttendance(req.params.id, req.body.records);
  res.json({ success: true, data: results });
});
