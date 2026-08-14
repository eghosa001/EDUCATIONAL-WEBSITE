import { reportService } from '../services/report.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'school_admin'];

const isAdmin = (user) => ADMIN_ROLES.includes(user.role);

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listReports = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const generatedBy = isAdmin(req.user) ? undefined : req.user.id;

  const { data, pagination } = await reportService.list({ page, limit, generatedBy });

  res.json({ success: true, data: { reports: data }, pagination });
});

export const createReport = asyncHandler(async (req, res) => {
  const { type, title, description, filters } = req.body;

  const { report, data } = await reportService.generate(type, {
    title,
    description,
    filters,
    generatedBy: req.user.id,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, data: { report, data } });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getById(req.params.reportId);
  if (!report) notFound('Report');

  if (!isAdmin(req.user) && report.generated_by !== req.user.id) {
    throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  res.json({ success: true, data: { report } });
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await reportService.getById(req.params.reportId);
  if (!report) notFound('Report');

  if (!isAdmin(req.user) && report.generated_by !== req.user.id) {
    throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  await reportService.remove(report.id);
  res.json({ success: true, message: 'Report deleted' });
});
