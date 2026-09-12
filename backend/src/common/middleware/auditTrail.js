import { auditLogService } from '../../administration/services/auditLog.service.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const PRIVILEGED_ROLES = new Set(['super_admin', 'admin', 'content_admin', 'school_admin']);
const SENSITIVE_KEY = /(password|passcode|token|secret|authorization|cookie|api[_-]?key|gateway[_-]?token)/i;

const sanitize = (value, depth = 0) => {
  if (depth > 5) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 2000) return `${value.slice(0, 2000)}…`;
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).slice(0, 100).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[redacted]' : sanitize(item, depth + 1),
    ])
  );
};

const resourceFromPath = (path = '') => {
  const segments = path.split('/').filter(Boolean);
  return segments[0] || 'api';
};

const resourceIdFromRequest = (req) => {
  const explicit = req.params?.id || req.params?.userId || req.params?.subscriptionId || req.params?.paymentId;
  if (explicit) return String(explicit).slice(0, 200);
  const match = String(req.path || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return match?.[0] || null;
};

export const auditPrivilegedMutation = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method) || String(req.path || '').startsWith('/auth')) return next();

  const startedAt = Date.now();
  res.once('finish', () => {
    const user = req.user;
    if (!user?.id || !PRIVILEGED_ROLES.has(user.role) || res.statusCode < 200 || res.statusCode >= 400) return;

    const resourceType = resourceFromPath(req.path);
    const action = `${req.method.toLowerCase()}_${resourceType}`;
    const changes = sanitize(req.body || {});

    void auditLogService.logAction({
      userId: user.id,
      action,
      resourceType,
      resourceId: resourceIdFromRequest(req),
      changes,
      metadata: {
        method: req.method,
        path: String(req.originalUrl || req.url || '').split('?')[0],
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      req,
    }).catch((error) => {
      console.error('[audit] Failed to record privileged mutation:', error instanceof Error ? error.message : error);
    });
  });

  next();
};

export default auditPrivilegedMutation;
