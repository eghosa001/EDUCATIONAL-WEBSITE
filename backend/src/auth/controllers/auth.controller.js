import { pool } from '../../common/database/index.js';
import { generateTokens, hashPassword, comparePassword, hashToken, generateSecureToken } from '../utils/jwt.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { USER_ROLES, USER_STATUS } from '../../common/constants/index.js';

export const register = async (req, res) => {
  const { email, phone, password, firstName, lastName, middleName, dateOfBirth, gender } = req.body;

  let existingUser;
  try {
    existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
  } catch (dbErr) {
    console.error('[register] Database query failed:', dbErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email or phone already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = await generateSecureToken();
  const verificationTokenHash = hashToken(verificationToken);

  const result = await pool.query(
    `INSERT INTO users (email, phone, password_hash, first_name, last_name, middle_name, date_of_birth, gender, email_verified_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $9::text IS NULL THEN NOW() ELSE NULL END)
     RETURNING id, email, first_name, last_name, is_verified, created_at`,
    [email, phone, passwordHash, firstName, lastName, middleName, dateOfBirth, gender, phone ? null : verificationTokenHash]
  );

  const user = result.rows[0];

  const studentRole = await pool.query('SELECT id FROM roles WHERE name = $1', [USER_ROLES.STUDENT]);
  if (studentRole.rows.length > 0) {
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [user.id, studentRole.rows[0].id]
    );
  }

  const tokens = generateTokens({ ...user, role: USER_ROLES.STUDENT, permissions: [] });

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')`,
    [user.id, hashToken(tokens.accessToken), hashToken(tokens.refreshToken), req.body.deviceInfo, req.ip, req.get('user-agent')]
  );

  if (!user.is_verified && verificationToken) {
    console.log(`Verification token for ${email}: ${verificationToken}`);
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: user.is_verified,
      },
      tokens,
    },
  });
};

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  let result;
  try {
    result = await pool.query(
      `SELECT u.*, array_agg(r.name) as roles, array_agg(r.permissions) as permissions
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );
  } catch (dbErr) {
    console.error('[login] Database query failed:', dbErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  let isValid;
  try {
    isValid = await comparePassword(password, user.password_hash);
  } catch (hashErr) {
    console.error('[login] Password comparison failed:', hashErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (!isValid) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const primaryRole = user.roles?.[0] || USER_ROLES.STUDENT;
  const permissions = user.permissions?.[0] || {};

  await pool.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: primaryRole,
    permissions,
  });

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${rememberMe ? '30' : '7'} days')`,
    [user.id, hashToken(tokens.accessToken), hashToken(tokens.refreshToken), req.body.deviceInfo, req.ip, req.get('user-agent')]
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        role: primaryRole,
        permissions,
        createdAt: user.created_at,
      },
      tokens,
    },
  });
};

export const refreshToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No refresh token provided', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const refreshToken = authHeader.split(' ')[1];
  const tokenHash = hashToken(refreshToken);

  const sessionResult = await pool.query(
    `SELECT s.*, u.email, u.first_name, u.last_name, u.is_active,
            array_agg(r.name) as roles, array_agg(r.permissions) as permissions
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE s.refresh_token_hash = $1 AND s.expires_at > NOW()
     GROUP BY s.id, u.id`,
    [tokenHash]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const session = sessionResult.rows[0];
  if (!session.is_active) {
    throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  await pool.query('DELETE FROM sessions WHERE id = $1', [session.id]);

  const primaryRole = session.roles?.[0] || USER_ROLES.STUDENT;
  const permissions = session.permissions?.[0] || {};

  const tokens = generateTokens({
    id: session.user_id,
    email: session.email,
    role: primaryRole,
    permissions,
  });

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')`,
    [session.user_id, hashToken(tokens.accessToken), hashToken(tokens.refreshToken), req.body.deviceInfo, req.ip, req.get('user-agent')]
  );

  res.json({
    success: true,
    message: 'Token refreshed',
    data: { tokens },
  });
};

export const logout = async (req, res) => {
  const tokenHash = hashToken(req.token);
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);

  res.json({ success: true, message: 'Logged out successfully' });
};

export const logoutAll = async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [req.user.id]);

  res.json({ success: true, message: 'Logged out from all devices' });
};

export const getCurrentUser = async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.middle_name, u.date_of_birth, u.gender,
            u.avatar_url, u.is_verified, u.is_active, u.last_login_at, u.created_at,
            array_agg(r.name) as roles, array_agg(r.permissions) as permissions
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.user.id]
  );

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        roles: user.roles || [],
        permissions: user.permissions || [],
      },
    },
  });
};

export const verifyEmail = async (req, res) => {
  const { id } = req.params;
  const token = req.body.token;

  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT u.* FROM users u
     WHERE u.id = $1 AND u.is_verified = FALSE`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid verification request', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  await pool.query(
    'UPDATE users SET is_verified = TRUE, email_verified_at = NOW() WHERE id = $1',
    [id]
  );

  res.json({ success: true, message: 'Email verified successfully' });
};

export const resendVerification = async (req, res) => {
  const user = req.user;

  if (user.is_verified) {
    throw new AppError('Email already verified', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const verificationToken = await generateSecureToken();
  const verificationTokenHash = hashToken(verificationToken);

  await pool.query(
    'UPDATE users SET email_verification_token = $1 WHERE id = $2',
    [verificationTokenHash, user.id]
  );

  console.log(`Resent verification token for ${user.email}: ${verificationToken}`);

  res.json({ success: true, message: 'Verification email sent' });
};