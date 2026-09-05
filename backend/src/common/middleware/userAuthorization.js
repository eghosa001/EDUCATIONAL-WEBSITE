import { AppError } from '../errors/index.js';

const hasRole = (user, roles) => roles.some((role) => user?.role === role || user?.roles?.includes(role));

export const authorizeUserRoute = (req, _res, next) => {
  const id = req.params?.id;
  const path = req.path || '';

  // Collection endpoint exposes account records and is administrator-only.
  if (!id) {
    if (hasRole(req.user, ['content_admin', 'super_admin'])) return next();
    throw new AppError('Administrator access required', 403, 'AUTHORIZATION_ERROR');
  }

  // Role assignment/removal can never be performed by the target user.
  if (path.includes('/roles')) {
    if (hasRole(req.user, ['super_admin'])) return next();
    throw new AppError('Super administrator access required', 403, 'AUTHORIZATION_ERROR');
  }

  // A user may access only their own account data unless an administrator is
  // explicitly acting on another account.
  if (req.user?.id === id || hasRole(req.user, ['content_admin', 'super_admin'])) return next();
  throw new AppError('Not authorized to access this user', 403, 'AUTHORIZATION_ERROR');
};

export default authorizeUserRoute;
