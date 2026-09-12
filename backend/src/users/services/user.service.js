import { query, useSupabase, supabaseQuery, getByTable } from '../../common/database/index.js';
import userModel from '../models/user.model.js';

const ROLE_PRIORITY = ['super_admin', 'admin', 'content_admin', 'school_admin', 'teacher', 'parent', 'student'];

const normalizeRoles = (roleRows) => {
  const roles = [...new Set(roleRows.map((row) => row.name).filter(Boolean))];
  roles.sort((a, b) => {
    const ai = ROLE_PRIORITY.indexOf(a);
    const bi = ROLE_PRIORITY.indexOf(b);
    return (ai === -1 ? ROLE_PRIORITY.length : ai) - (bi === -1 ? ROLE_PRIORITY.length : bi);
  });
  return roles;
};

const normalizePermissions = (roleRows) => {
  const permissions = new Set();
  for (const row of roleRows) {
    const value = row.permissions;
    if (Array.isArray(value)) value.forEach((permission) => permissions.add(permission));
    else if (value && typeof value === 'object') {
      for (const [permission, allowed] of Object.entries(value)) if (allowed) permissions.add(permission);
    }
  }
  return [...permissions];
};

export const userService = {
  async list(params) {
    return userModel.list(params);
  },

  async getById(id) {
    return useSupabase ? getByTable('users', 'id', id) : userModel.findById(id);
  },

  async getUserById(id) {
    const result = useSupabase
      ? await getByTable('users', 'id', id)
      : await userModel.findById(id);
    if (!result) return null;

    let roleRows;
    if (useSupabase) {
      const roleResult = await supabaseQuery('user_roles', {
        select: 'roles!inner(name,permissions)',
        filters: { user_id: id },
      });
      roleRows = (roleResult.rows || [])
        .map((row) => row.roles)
        .filter(Boolean);
    } else {
      const roleResult = await query(
        `SELECT r.name, r.permissions FROM roles r
         JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [id]
      );
      roleRows = roleResult.rows;
    }

    const roles = normalizeRoles(roleRows);
    const primaryRole = roles[0] || 'student';
    const permissions = normalizePermissions(roleRows);

    return { ...result, roles, role: primaryRole, primaryRole, permissions };
  },

  async deactivateUser(userId) {
    return userModel.deactivate(userId);
  },

  async activateUser(userId) {
    return userModel.activate(userId);
  },

  async getUserStats() {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total,
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active,
        (SELECT COUNT(*) FROM users WHERE is_verified = TRUE) as verified,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'student') as students,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'teacher') as teachers,
        (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'parent') as parents,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as newThisMonth
    `);
    return result.rows[0];
  },

  async searchUsers(searchTerm) {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.is_verified,
              array_agg(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email ILIKE $1 OR u.first_name ILIKE $2 OR u.last_name ILIKE $3
       GROUP BY u.id
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm]
    );
    return result.rows;
  },
};

export default userService;
