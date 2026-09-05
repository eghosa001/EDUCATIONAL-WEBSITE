import { query, transaction } from '../../common/database/index.js';
import { hashPassword, comparePassword, hashToken, generateSecureToken } from '../utils/jwt.js';
import { emailService } from '../../notifications/services/email.service.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await query('SELECT id, email, first_name FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1', [email]);

  // Always return the same response to avoid account enumeration.
  if (result.rows.length > 0) {
    const user = result.rows[0];
    const resetToken = await generateSecureToken();
    const resetTokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 3600000);
    await query(`INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, used_at = NULL`, [user.id, resetTokenHash, expiresAt]);

    const baseUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const emailResult = await emailService.send(
      user.email,
      'Reset your THE GUIDE password',
      `<p>Hello ${String(user.first_name || 'there').replace(/[<>]/g, '')},</p><p>Use the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      `Reset your THE GUIDE password: ${resetUrl}\nThis link expires in 1 hour.`
    );
    if (!emailResult.sent) console.error('[forgot-password] Reset email could not be sent');
  }

  res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(password);

  await transaction(async () => {
    const result = await query(`SELECT user_id FROM password_resets WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL FOR UPDATE`, [tokenHash]);
    if (result.rows.length === 0) throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    const { user_id: userId } = result.rows[0];
    await query('UPDATE users SET password_hash = $1 WHERE id = $2 AND is_active = TRUE', [passwordHash, userId]);
    await query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND token_hash = $2 AND used_at IS NULL', [userId, tokenHash]);
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  });

  res.json({ success: true, message: 'Password reset successful' });
};

export const changePassword = async (req, res) => {
  if (!req.user?.id) throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  const { currentPassword, newPassword } = req.body;
  const result = await query('SELECT password_hash FROM users WHERE id = $1 AND is_active = TRUE', [req.user.id]);
  if (!result.rows[0]) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  if (!(await comparePassword(currentPassword, result.rows[0].password_hash))) throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  const passwordHash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
  await query('DELETE FROM sessions WHERE user_id = $1', [req.user.id]);
  res.json({ success: true, message: 'Password changed successfully' });
};
