import { query } from '../../common/database/index.js';

const emailTransporter = (() => {
  try {
    const nodemailer = require('nodemailer');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.dev',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch {
    return null;
  }
})();

export const emailService = {
  async send(to, subject, html, text) {
    if (!emailTransporter) {
      console.log('[Email] Transport not configured. Skipping:', subject);
      return { sent: false, reason: 'no-transport' };
    }

    try {
      const info = await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@eduplatform.ng',
        to,
        subject,
        html,
        text,
      });
      await query(
        `INSERT INTO notifications (user_id, type, title, body, channel, sent_at)
         SELECT id, 'email_sent', $1, $2, 'email', NOW() FROM users WHERE email = $3 LIMIT 1`,
        [subject, text, to]
      );
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email] Send failed:', error.message);
      return { sent: false, error: error.message };
    }
  },

  async sendWelcomeEmail(userId, email, firstName) {
    return this.send(
      email,
      `Welcome to EduPlatform, ${firstName}!`,
      `<h1>Welcome, ${firstName}!</h1><p>Thank you for joining EduPlatform. Start your learning journey today.</p>`,
      `Welcome, ${firstName}! Thank you for joining EduPlatform.`
    );
  },

  async sendExamResult(userId, email, examTitle, score, percentage) {
    const passed = percentage >= 50;
    return this.send(
      email,
      `Your ${examTitle} results are ready`,
      `<h1>Exam Results</h1><p>Your result for <strong>${examTitle}</strong>:</p><p>Score: ${score}%</p><p>${passed ? '<span style="color:green">Passed!</span>' : '<span style="color:orange">Keep practicing!</span>'}</p>`,
      `Your result for ${examTitle}: ${score}% - ${passed ? 'Passed!' : 'Keep practicing!'}`
    );
  },

  async sendAssignmentReminder(userId, email, assignmentTitle, dueDate) {
    return this.send(
      email,
      `Assignment reminder: ${assignmentTitle}`,
      `<h1>Assignment Due Soon</h1><p><strong>${assignmentTitle}</strong> is due on ${new Date(dueDate).toLocaleDateString()}.</p>`,
      `Assignment reminder: ${assignmentTitle} is due on ${new Date(dueDate).toLocaleDateString()}.`
    );
  },

  async sendPaymentConfirmation(userId, email, amount, purpose) {
    return this.send(
      email,
      `Payment confirmed - ${purpose}`,
      `<h1>Payment Confirmed</h1><p>Your payment of <strong>₦${Number(amount).toLocaleString()}</strong> for ${purpose} has been confirmed.</p>`,
      `Payment confirmed: ₦${Number(amount).toLocaleString()} for ${purpose}.`
    );
  },

  async sendBulk(users, subject, html, text) {
    const results = await Promise.allSettled(
      users.map(u => this.send(u.email, subject, html, text))
    );
    return results.filter(r => r.status === 'fulfilled' && r.value.sent).length;
  },
};

export default emailService;
