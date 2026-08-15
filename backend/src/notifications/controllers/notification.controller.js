import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { query } from '../../common/database/index.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../../common/config/index.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await notificationService.listByUser(req.user.id, { page, limit });
  res.json({ success: true, ...result });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  if (!notification) {
    throw new AppError('Notification not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  res.json({ success: true, data: { notification } });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ success: true, message: 'All notifications marked as read' });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json({ success: true, data: { count } });
});

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: parseInt(config.smtp.port || '587'),
  secure: config.smtp.secure === 'true',
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

const twilioClient = config.sms?.sid
  ? twilio(config.sms.sid, config.sms.authToken)
  : null;

export const sendNotification = asyncHandler(async (req, res) => {
  const { userIds, type, title, body, data, actionUrl, channel = 'in_app' } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('userIds is required and must be an array', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  if (!title || !body) {
    throw new AppError('title and body are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const notifications = userIds.map((uid) => ({
    userId: uid,
    type,
    title,
    body,
    data: data || {},
    actionUrl: actionUrl || null,
    channel,
  }));

  const created = await notificationService.bulkCreate(notifications);

  if (channel === 'email' || channel === 'all') {
    for (const user of created) {
      try {
        const result = await transporter.sendMail({
          from: config.smtp.from,
          to: user.email || '',
          subject: title,
          text: body,
        });
        if (config.env === 'development') {
          console.log(`Email sent to ${user.userId}:`, result.messageId);
        }
      } catch (error) {
        console.error(`Failed to send email to ${user.userId}:`, error.message);
      }
    }
  }

  if (channel === 'sms' || channel === 'all') {
    if (twilioClient) {
      for (const user of created) {
        try {
          const smsResult = await twilioClient.messages.create({
            body: `${title}: ${body}`,
            from: config.sms.fromNumber,
            to: user.phone,
          });
          if (config.env === 'development') {
            console.log(`SMS sent to ${user.userId}:`, smsResult.sid);
          }
        } catch (error) {
          console.error(`Failed to send SMS to ${user.userId}:`, error.message);
        }
      }
    }
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Notifications created for ${created.length} users`,
    data: { notifications: created },
  });
});

// Admin endpoints
export const listAllNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions = [];
  const values = [];
  let idx = 1;

  if (type) {
    conditions.push(`type = $${idx}`);
    values.push(type);
    idx++;
  }
  if (search) {
    conditions.push(`(title ILIKE $${idx} OR body ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [result, countResult] = await Promise.all([
    query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, Number(limit), offset]
    ),
    query(`SELECT COUNT(*)::int AS total FROM notifications ${where}`, values),
  ]);

  res.json({
    success: true,
    data: { notifications: result.rows },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: parseInt(countResult.rows[0]?.total || 0),
      totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / Number(limit)),
    },
  });
});

export const getNotificationStats = asyncHandler(async (req, res) => {
  const [totalResult, todayResult, unreadResult, byChannel, byType] = await Promise.all([
    query('SELECT COUNT(*)::int AS total FROM notifications'),
    query("SELECT COUNT(*)::int AS total FROM notifications WHERE DATE(created_at) = CURRENT_DATE"),
    query('SELECT COUNT(*)::int AS total FROM notifications WHERE read_at IS NULL'),
    query('SELECT channel, COUNT(*)::int AS total FROM notifications GROUP BY channel ORDER BY total DESC'),
    query('SELECT type, COUNT(*)::int AS total FROM notifications GROUP BY type ORDER BY total DESC'),
  ]);

  res.json({
    success: true,
    data: {
      total: parseInt(totalResult.rows[0]?.total || 0),
      today: parseInt(todayResult.rows[0]?.total || 0),
      unread: parseInt(unreadResult.rows[0]?.total || 0),
      byChannel: byChannel.rows,
      byType: byType.rows,
    },
  });
});

export const broadcastNotification = asyncHandler(async (req, res) => {
  const { userIds, type, title, body, data, actionUrl, channel = 'in_app' } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('userIds is required and must be an array', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  if (!title || !body) {
    throw new AppError('title and body are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const notifications = userIds.map((uid) => ({
    userId: uid,
    type,
    title,
    body,
    data: data || {},
    actionUrl: actionUrl || null,
    channel,
  }));

  const created = await notificationService.bulkCreate(notifications);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Broadcast sent to ${created.length} users`,
    data: { notifications: created },
  });
});

export const broadcastToAll = asyncHandler(async (req, res) => {
  const { type, title, body, data, actionUrl, channel = 'in_app' } = req.body;

  if (!title || !body) {
    throw new AppError('title and body are required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const usersResult = await query('SELECT id, email, phone FROM users WHERE is_active = true');
  const users = usersResult.rows;

  const notifications = users.map((user) => ({
    userId: user.id,
    type,
    title,
    body,
    data: data || {},
    actionUrl: actionUrl || null,
    channel,
  }));

  const created = await notificationService.bulkCreate(notifications);

  if (channel === 'email' || channel === 'all') {
    for (const user of created) {
      try {
        await transporter.sendMail({
          from: config.smtp.from,
          to: user.email || '',
          subject: title,
          text: body,
        });
      } catch (error) {
        console.error(`Email failed for ${user.userId}:`, error.message);
      }
    }
  }

  if (channel === 'sms' || channel === 'all' && twilioClient) {
    for (const user of users) {
      if (user.phone) {
        try {
          await twilioClient.messages.create({
            body: `${title}: ${body}`,
            from: config.sms.fromNumber,
            to: user.phone,
          });
        } catch (error) {
          console.error(`SMS failed for ${user.id}:`, error.message);
        }
      }
    }
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Broadcast sent to ${created.length} active users`,
    data: { totalSent: created.length, totalUsers: users.length },
  });
});
