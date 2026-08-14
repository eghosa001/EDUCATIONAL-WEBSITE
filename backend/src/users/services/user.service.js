import { query } from '../../common/database/index.js';
import userModel from '../models/user.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const getUserById = async (id) => {
  const user = await userModel.findById(id);
  if (!user) return null;

  const roles = await userModel.getRoles(id);

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    middleName: user.middle_name,
    avatarUrl: user.avatar_url,
    isActive: user.is_active,
    isVerified: user.is_verified,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    role: roles[0]?.name || null,
    roles: roles.map(r => r.name),
    permissions: [...new Set(roles.flatMap(r => r.permissions || []))],
  };
};

export const getPublicUserById = async (id) => {
  const user = await getUserById(id);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    createdAt: user.createdAt,
  };
};

export const getUserByEmail = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) return null;
  return getUserById(user.id);
};

export const getUserByPhone = async (phone) => {
  const user = await userModel.findByPhone(phone);
  if (!user) return null;
  return getUserById(user.id);
};

export const listUsers = async (filters) => {
  return userModel.list(filters);
};

export const assignRole = async (userId, roleName, assignedBy) => {
  const result = await query(
    `INSERT INTO user_roles (user_id, role_id, assigned_by)
     SELECT $1, id, $3 FROM roles WHERE name = $2
     ON CONFLICT (user_id, role_id) DO NOTHING
     RETURNING *`,
    [userId, roleName, assignedBy]
  );

  if (result.rows.length === 0) {
    throw new AppError('User or role not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
};

export const removeRole = async (userId, roleName) => {
  await query(
    `DELETE FROM user_roles
     WHERE user_id = $1 AND role_id IN (SELECT id FROM roles WHERE name = $2)`,
    [userId, roleName]
  );
};

export const requireExistingUser = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return user;
};

export default {
  getUserById,
  getPublicUserById,
  getUserByEmail,
  getUserByPhone,
  listUsers,
  assignRole,
  removeRole,
  requireExistingUser,
};
