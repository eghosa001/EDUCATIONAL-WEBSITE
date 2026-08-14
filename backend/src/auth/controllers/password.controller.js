import { pool } from '../../common/database/index.js';
import { hashPassword, comparePassword, hashToken, generateSecureToken } from '../utils/jwt.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const result = await pool.query(
    'SELECT id, email FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );

  if (result.rows.length === 0) {
    return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  }

  const user = result.rows[0];
  const resetToken = await generateSecureToken();
  const resetTokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 3600000);

  await pool.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, used_at = NULL`,
    [user.id, resetTokenHash, expiresAt]
  );

  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT pr.user_id FROM password_resets pr
     WHERE pr.token_hash = $1 AND pr.expires_at > NOW() AND pr.used_at IS NULL`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const { user_id } = result.rows[0];
  const passwordHash = await hashPassword(password);

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user_id]);
  await pool.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND token_hash = $2', [user_id, tokenHash]);
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [user_id]);

  res.json({ success: true, message: 'Password reset successful' });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  const isValid = await comparePassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const passwordHash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
  await pool.query('DELETE FROM sessions WHERE user_id = $1 AND id != $2', [userId, req.sessionId]);

  res.json({ success: true, message: 'Password changed successfully' });
};