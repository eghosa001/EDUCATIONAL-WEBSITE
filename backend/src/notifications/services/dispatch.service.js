import { query } from '../../common/database/index.js';
import notificationService from '../services/notification.service.js';

export const notificationDispatch = {
  async dispatch(data) {
    const { userIds, type, title, body, data: payload, channel = 'in_app' } = data;

    await notificationService.sendToUsers(type, Array.isArray(userIds) ? userIds : [userIds], {
      title,
      body,
      data: payload,
      channel,
    });

    if (channel === 'email' || channel === 'all') {
      const users = Array.isArray(userIds) ? userIds : [userIds];
      const userResults = await query(
        `SELECT id, email, first_name, last_name FROM users WHERE id = ANY($1)`,
        [users]
      );
      for (const user of userResults.rows) {
        const htmlBody = `<h3>${title}</h3><p>${body || ''}</p>`;
        await (await import('../services/email.service.js')).default.send(
          user.email,
          title,
          htmlBody,
          `${title}\n\n${body || ''}`
        );
      }
    }
  },

  async notifyNewCourse(userId, course) {
    return this.dispatch({
      userIds: [userId],
      type: 'new_course',
      title: 'New Course Available',
      body: `"${course.title}" has been published. Start learning now!`,
      data: { courseId: course.id },
      channel: 'in_app',
    });
  },

  async notifyExamResult(userId, examTitle, score, percentage) {
    const emailService = (await import('../services/email.service.js')).default;
    const user = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
    await emailService.sendExamResult(userId, user.rows[0]?.email, examTitle, percentage, score);
    return this.dispatch({
      userIds: [userId],
      type: 'exam_result',
      title: 'Exam Result Available',
      body: `You scored ${percentage}% on "${examTitle}". ${percentage >= 50 ? 'Congratulations!' : 'Keep practicing!'}`,
      data: { examTitle, score, percentage },
      channel: 'all',
    });
  },

  async notifyAssignmentDue(userId, assignmentTitle, dueDate) {
    const emailService = (await import('../services/email.service.js')).default;
    const user = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
    await emailService.sendAssignmentReminder(userId, user.rows[0]?.email, assignmentTitle, dueDate);
    return this.dispatch({
      userIds: [userId],
      type: 'assignment_due',
      title: 'Assignment Due Soon',
      body: `"${assignmentTitle}" is due on ${new Date(dueDate).toLocaleDateString()}.`,
      data: { assignmentTitle, dueDate },
      channel: 'all',
    });
  },

  async notifyPayment(userId, amount, purpose) {
    const emailService = (await import('../services/email.service.js')).default;
    const user = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
    await emailService.sendPaymentConfirmation(userId, user.rows[0]?.email, amount, purpose);
    return this.dispatch({
      userIds: [userId],
      type: 'payment',
      title: 'Payment Confirmed',
      body: `Your payment of ₦${Number(amount).toLocaleString()} for ${purpose} was successful.`,
      data: { amount, purpose },
      channel: 'all',
    });
  },
};

export default notificationDispatch;
