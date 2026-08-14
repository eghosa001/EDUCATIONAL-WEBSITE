import { query } from '../../common/database/index.js';
import userModel from '../models/user.model.js';

export const userService = {
  async list(params) {
    return userModel.list(params);
  },

  async getById(id) {
    return userModel.findById(id);
  },

  async updateRole(userId, role) {
    return userModel.updateRole(userId, role);
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
        (SELECT COUNT(*) FROM users WHERE role = 'student') as students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teachers,
        (SELECT COUNT(*) FROM users WHERE role = 'parent') as parents,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as newThisMonth
    `);
    return result.rows[0];
  },

  async searchUsers(searchTerm) {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.is_verified,
              array_agg(r.name) as roles
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
