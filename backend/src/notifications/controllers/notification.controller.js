import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
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
  port: config.smtp.port,
  secure: config.smtp.secure,
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
          to: user.email || userIds[userIds.indexOf(user.userId)],
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
