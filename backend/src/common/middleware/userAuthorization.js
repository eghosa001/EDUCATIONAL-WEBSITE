import { AppError } from '../errors/index.js';

const hasRole = (user, roles) => roles.some((role) => user?.role === role || user?.roles?.includes(role));

export const authorizeUserRoute = (req, _res, next) => {
  // When mounted with app.use('/users', ...), Express has not populated :id yet.
  const pathParts = (req.path || '').split('/').filter(Boolean);
  const id = req.params?.id || pathParts[0];
  const path = req.path || '';

  if (!id) {
    if (hasRole(req.user, ['content_admin', 'super_admin'])) return next();
    throw new AppError('Administrator access required', 403, 'AUTHORIZATION_ERROR');
  }

  if (pathParts[1] === 'roles' || path.includes('/roles/')) {
    if (hasRole(req.user, ['super_admin'])) return next();
    throw new AppError('Super administrator access required', 403, 'AUTHORIZATION_ERROR');
  }

  if (req.user?.id === id || hasRole(req.user, ['content_admin', 'super_admin'])) return next();
  throw new AppError('Not authorized to access this user', 403, 'AUTHORIZATION_ERROR');
};

export default authorizeUserRoute;
