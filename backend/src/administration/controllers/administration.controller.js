import { auditLogService } from '../services/auditLog.service.js';
import { settingsService } from '../services/settings.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, action, resourceType } = req.query;

  const { data, pagination } = await auditLogService.list({ page, limit, action, resourceType });

  res.json({ success: true, data: { logs: data }, pagination });
});

export const getAuditLogsByResource = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.params;

  const logs = await auditLogService.getByResource(resourceType, resourceId);

  res.json({ success: true, data: { logs } });
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAll();

  res.json({ success: true, data: { settings } });
});

export const getSetting = asyncHandler(async (req, res) => {
  const setting = await settingsService.get(req.params.key);
  if (!setting) {
    throw new AppError('Setting not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, data: { setting } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { key, value, updates } = req.body;
  const updated = [];

  if (Array.isArray(updates)) {
    for (const item of updates) {
      if (item && item.key) {
        updated.push(await settingsService.set(item.key, item.value, req.user.id));
      }
    }
  } else if (key) {
    updated.push(await settingsService.set(key, value, req.user.id));
  } else {
    throw new AppError(
      'Provide { key, value } or { updates: [{ key, value }] }',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  res.json({ success: true, message: 'Settings updated', data: { settings: updated } });
});
