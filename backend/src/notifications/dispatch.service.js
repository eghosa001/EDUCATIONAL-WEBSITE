import { query, getClient } from '../../common/database/index.js';
import { AppError } from '../../common/errors/index.js';
import { HTTP_STATUS } from '../../common/constants/index.js';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { config } from '../../common/config/index.js';

const NOTIFICATION_TYPES = {
  COURSE: 'course',
  EXAM: 'exam',
  ASSIGNMENT: 'assignment',
  PAYMENT: 'payment',
  RESULT: 'result',
  ANNOUNCEMENT: 'announcement',
  STUDY_REMINDER: 'study_reminder',
  SUBSCRIPTION_EXPIRY: 'subscription_expiry',
  SYSTEM: 'system',
};

const CHANNELS = {
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
};

export const notificationDispatcher = {
  async send(notificationData) {
    const { userId, type, title, message, channel, data = {}, priority = 'normal' } = notificationData;

    if (!userId || !type || !channel) {
      throw new AppError('userId, type, and channel are required', HTTP_STATUS.BAD_REQUEST, 'INVALID_PARAMS');
    }

    const notification = await this.createNotification(userId, type, title, message, data, priority);

    try {
      const results = await Promise.allSettled([
        channel === CHANNELS.PUSH ? this.sendPush(notification) : Promise.resolve(null),
        channel === CHANNELS.EMAIL ? this.sendEmail(notification) : Promise.resolve(null),
        channel === CHANNELS.SMS ? this.sendSMS(notification) : Promise.resolve(null),
        channel === CHANNELS.IN_APP ? Promise.resolve(notification) : Promise.resolve(null),
      ]);

      return {
        notificationId: notification.id,
        results: results.map((r, i) => ({
          channel: [CHANNELS.PUSH, CHANNELS.EMAIL, CHANNELS.SMS, CHANNELS.IN_APP][i],
          success: r.status === 'fulfilled',
          error: r.status === 'rejected' ? r.reason?.message : null,
        })),
      };
    } catch (error) {
      await this.updateStatus(notification.id, 'failed');
      throw error;
    }
  },

  async sendToMultiple(users, notificationData) {
    const batch = users.map(userId =>
      this.send({ ...notificationData, userId })
    );
    return Promise.all(batch);
  },

  async createNotification(userId, type, title, message, data = {}, priority = 'normal') {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent')
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data), priority]
    );
    return result.rows[0];
  },

  async updateStatus(notificationId, status) {
    await query('UPDATE notifications SET status = $2 WHERE id = $1', [notificationId, status]);
  },

  async sendPush(notification) {
    const { userId, title, message, data } = notification;
    const fcmToken = await this.getFCMToken(userId);

    if (!fcmToken) return;

    try {
      const admin = new AdminSDK(config.firebase);
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body: message },
        data,
        android: { priority: notification.priority === 'high' ? 'high' : 'normal' },
        apns: { payload: { alert: { title, body: message }, sound: 'default' } },
      });
    } catch (error) {
      console.error('FCM send error:', error);
    }
  },

  async sendEmail(notification) {
    const { userId, title, message, data } = notification;
    const user = await this.getUserById(userId);

    if (!user?.email) return;

    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: { user: config.email.user, pass: config.email.pass },
    });

    const emailTemplate = this.getEmailTemplate(notification.type, title, message, data);

    await transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: title,
      html: emailTemplate,
    });
  },

  async sendSMS(notification) {
    const { userId, title, message } = notification;
    const user = await this.getUserById(userId);

    if (!user?.phone) return;

    const accountSid = config.twilio.accountSid;
    const authToken = config.twilio.authToken;
    const client = Twilio(accountSid, authToken);

    await client.messages.create({
      body: `${title}: ${message}`,
      from: config.twilio.phoneNumber,
      to: user.phone,
    });
  },

  getEmailTemplate(type, title, message, data = {}) {
    const templates = {
      [NOTIFICATION_TYPES.COURSE]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1D4ED8;">${title}</h2>
          <p>${message}</p>
          ${data.courseName ? `<p><strong>Course:</strong> ${data.courseName}</p>` : ''}
          <a href="${data.actionUrl || '#'}" style="display: inline-block; padding: 12px 24px; background: #1D4ED8; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Take Action</a>
        </div>`,
      [NOTIFICATION_TYPES.EXAM]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">${title}</h2>
          <p>${message}</p>
          ${data.examName ? `<p><strong>Exam:</strong> ${data.examName}</p>` : ''}
          ${data.dueDate ? `<p><strong>Due:</strong> ${data.dueDate}</p>` : ''}
        </div>`,
      [NOTIFICATION_TYPES.ASSIGNMENT]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D97706;">${title}</h2>
          <p>${message}</p>
          ${data.assignmentName ? `<p><strong>Assignment:</strong> ${data.assignmentName}</p>` : ''}
        </div>`,
      [NOTIFICATION_TYPES.RESULT]: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">${title}</h2>
          <p>${message}</p>
          ${data.score ? `<p><strong>Score:</strong> ${data.score}%</p>` : ''}
        </div>`,
      default: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${message}</p>
        </div>`,
    };
    return templates[type] || templates.default;
  },

  async getUserById(userId) {
    const result = await query('SELECT id, email, phone, first_name, last_name FROM users WHERE id = $1', [userId]);
    return result.rows[0] || null;
  },

  async getFCMToken(userId) {
    const result = await query('SELECT fcm_token FROM user_devices WHERE user_id = $1 AND is_active = true LIMIT 1', [userId]);
    return result.rows[0]?.fcmToken || null;
  },

  async getChannelPreferences(userId) {
    const result = await query(
      `SELECT channel FROM user_notification_preferences WHERE user_id = $1 AND is_enabled = true`,
      [userId]
    );
    return result.rows.map(r => r.channel);
  },

  async sendBulkNotifications(notificationList) {
    const results = [];
    for (const data of notificationList) {
      try {
        const result = await this.send(data);
        results.push({ ...data, notificationId: result.notificationId, success: true });
      } catch (error) {
        results.push({ ...data, success: false, error: error.message });
      }
    }
    return results;
  },
};

export default notificationDispatcher;
