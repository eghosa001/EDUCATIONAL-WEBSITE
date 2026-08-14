import { query } from '../../common/database/index.js';
import notificationModel from '../models/notification.model.js';

export const notificationService = {
  async create(data) {
    return notificationModel.create(data);
  },

  async listByUser(userId, params) {
    return notificationModel.listByUser(userId, params);
  },

  async markAsRead(notificationId, userId) {
    return notificationModel.markAsRead(notificationId, userId);
  },

  async markAllAsRead(userId) {
    return notificationModel.markAllAsRead(userId);
  },

  async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
    return result.rows[0].count;
  },

  async sendToUsers(type, userIds, data) {
    const notifications = userIds.map(uid => ({
      ...data,
      userId: uid,
      type,
    }));
    return notificationModel.bulkCreate(notifications);
  },
};

export default notificationService;
