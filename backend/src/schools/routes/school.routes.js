import { Router } from 'express';
import { validateRequest, asyncHandler } from '../../common/middleware/index.js';
import { schemas } from '../../common/validators/joi.js';
import * as schoolController from '../controllers/school.controller.js';
import * as classesController from '../controllers/classes.controller.js';
import * as timetableController from '../controllers/timetable.controller.js';
import * as attendanceController from '../controllers/attendance.controller.js';
import * as feesController from '../controllers/fees.controller.js';
import * as resultsController from '../controllers/results.controller.js';
import { requireRole } from '../../common/middleware/index.js';

export const schoolRoutes = Router();

// Base school routes
schoolRoutes.get('/',
  asyncHandler(schoolController.listSchools)
);

schoolRoutes.get('/:id',
  asyncHandler(schoolController.getSchoolById)
);

schoolRoutes.post('/',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.createSchool)
);

schoolRoutes.patch('/:id',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.updateSchool)
);

schoolRoutes.delete('/:id',
  requireRole('super_admin'),
  asyncHandler(schoolController.deleteSchool)
);

schoolRoutes.get('/:id/stats',
  asyncHandler(schoolController.getSchoolStats)
);

schoolRoutes.post('/join',
  asyncHandler(schoolController.joinSchool)
);

schoolRoutes.post('/:id/students',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.addStudent)
);

schoolRoutes.delete('/:id/students/:studentId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(schoolController.removeStudent)
);

// ---- Classes ----
schoolRoutes.get('/:id/classes',
  asyncHandler(classesController.listClasses)
);

schoolRoutes.post('/:id/classes',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(classesController.createClass)
);

schoolRoutes.patch('/:id/classes/:classId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(classesController.updateClass)
);

schoolRoutes.delete('/:id/classes/:classId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(classesController.deleteClass)
);

schoolRoutes.get('/:id/classes/:classId/students',
  asyncHandler(classesController.getStudentsByClass)
);

// ---- Timetable ----
schoolRoutes.get('/:id/timetables',
  asyncHandler(timetableController.listTimetables)
);

schoolRoutes.post('/:id/timetables',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(timetableController.createTimetable)
);

schoolRoutes.patch('/:id/timetables/:timeTableId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(timetableController.updateTimetable)
);

schoolRoutes.delete('/:id/timetables/:timeTableId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(timetableController.deleteTimetable)
);

// ---- Attendance ----
schoolRoutes.get('/:id/attendance',
  asyncHandler(attendanceController.listAttendance)
);

schoolRoutes.get('/:id/attendance/stats',
  asyncHandler(attendanceController.getAttendanceStats)
);

schoolRoutes.post('/:id/attendance',
  requireRole('super_admin', 'content_admin', 'teacher'),
  asyncHandler(attendanceController.markAttendance)
);

schoolRoutes.post('/:id/attendance/bulk',
  requireRole('super_admin', 'content_admin', 'teacher'),
  asyncHandler(attendanceController.bulkMarkAttendance)
);

// ---- Fees ----
schoolRoutes.get('/:id/fees',
  asyncHandler(feesController.listFees)
);

schoolRoutes.get('/:id/fees/summary',
  asyncHandler(feesController.getFeeSummary)
);

schoolRoutes.post('/:id/fees',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(feesController.createFee)
);

schoolRoutes.post('/:id/fees/:feeId/payments',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(feesController.recordPayment)
);

schoolRoutes.patch('/:id/fees/:feeId',
  requireRole('super_admin', 'content_admin'),
  asyncHandler(feesController.updateFee)
);

schoolRoutes.delete('/:id/fees/:feeId',
  requireRole('super_admin'),
  asyncHandler(feesController.deleteFee)
);

// ---- Results ----
schoolRoutes.get('/:id/results',
  asyncHandler(resultsController.listResults)
);

schoolRoutes.get('/:id/results/summary',
  asyncHandler(resultsController.getResultSummary)
);

schoolRoutes.post('/:id/results',
  requireRole('super_admin', 'content_admin', 'teacher'),
  asyncHandler(resultsController.createResult)
);

schoolRoutes.patch('/:id/results/:resultId',
  requireRole('super_admin', 'content_admin', 'teacher'),
  asyncHandler(resultsController.updateResult)
);

schoolRoutes.delete('/:id/results/:resultId',
  requireRole('super_admin'),
  asyncHandler(resultsController.deleteResult)
);
