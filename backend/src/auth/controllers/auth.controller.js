import { pool, supabaseQuery, supabaseInsert, supabaseUpdate, supabaseDelete, poolReady } from '../../common/database/index.js';
import { generateTokens, hashPassword, comparePassword, hashToken, generateSecureToken, decodeToken } from '../utils/jwt.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { USER_ROLES, USER_STATUS } from '../../common/constants/index.js';

// ---------- helpers ----------

const SECURE = process.env.NODE_ENV === 'production';

/** Set HttpOnly cookies for access and refresh tokens. */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const maxAgeAccess = SECURE ? 15 * 60 * 1000 : 15 * 60 * 1000; // 15 min
  const maxAgeRefresh = SECURE ? 7 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    maxAge: maxAgeAccess,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    maxAge: maxAgeRefresh,
    path: '/',
  });
};

/** Clear auth cookies on logout. */
const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
};

/**
 * Normalize a DB row (PostgreSQL pg format or Supabase REST format) into a common shape.
 * Both formats return the row as a plain object; pg wraps in { rows: [...] }.
 */
const extractRow = (result) => {
  if (result?.rows) return result.rows[0];
  return result;
};

const extractRows = (result) => {
  if (result?.rows) return result.rows;
  return Array.isArray(result) ? result : [];
};

// ---------- REGISTER ----------

export const register = async (req, res) => {
  const { email, phone, password, firstName, lastName, middleName, dateOfBirth, gender, role } = req.body;

  // Check existing user
  let existingUser;
  try {
    if (poolReady) {
      existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
      );
    } else {
      const r = await supabaseQuery('users', {
        select: 'id',
        filters: { _or: `(email.eq.${email}${phone ? `,phone.eq.${phone}` : ''})` },
      });
      existingUser = { rows: r.rows.map(row => ({ id: row.id })) };
    }
  } catch (dbErr) {
    console.error('[register] Database query failed:', dbErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (existingUser?.rows?.length > 0) {
    throw new AppError('User with this email or phone already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = await generateSecureToken();
  const verificationTokenHash = hashToken(verificationToken);

  const insertData = {
    email,
    phone: phone || null,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName || null,
    date_of_birth: dateOfBirth || null,
    gender: gender || null,
    is_verified: true,
    email_verified_at: new Date().toISOString(),
  };

  let user;
  try {
    const result = poolReady
      ? await pool.query(
          `INSERT INTO users (email, phone, password_hash, first_name, last_name, middle_name, date_of_birth, gender, is_verified, email_verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
           RETURNING id, email, first_name, last_name, is_verified, created_at`,
          [email, phone, passwordHash, firstName, lastName, middleName, dateOfBirth, gender]
        )
      : await supabaseInsert('users', insertData);

    user = extractRow(result);
  } catch (dbErr) {
    console.error('[register] Insert failed:', dbErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  // Assign role — honor frontend-provided role, fallback to student
  const validRoles = ['student', 'teacher', 'parent'];
  const assignedRole = validRoles.includes(role) ? role : USER_ROLES.STUDENT;

  try {
    const roleResult = poolReady
      ? await pool.query('SELECT id FROM roles WHERE name = $1', [assignedRole])
      : await supabaseQuery('roles', { select: 'id', filters: { name: assignedRole }, limit: 1 });

    if (roleResult?.rows?.length > 0) {
      await (poolReady
        ? pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, roleResult.rows[0].id])
        : supabaseInsert('user_roles', { user_id: user.id, role_id: roleResult.rows[0].id })
      );
    }
  } catch (e) {
    console.warn('[register] Role assignment failed (non-fatal):', e.message);
  }

  const tokens = generateTokens({ ...user, role: assignedRole, permissions: [] });

  try {
    const sessionData = {
      user_id: user.id,
      token_hash: hashToken(tokens.accessToken),
      refresh_token_hash: hashToken(tokens.refreshToken),
      device_info: req.body.deviceInfo || null,
      ip_address: req.ip,
      user_agent: req.get('user-agent') || '',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await (poolReady
      ? pool.query(
          `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')`,
          [user.id, sessionData.token_hash, sessionData.refresh_token_hash, req.body.deviceInfo, req.ip, req.get('user-agent')]
        )
      : supabaseInsert('sessions', sessionData));
  } catch (e) {
    console.warn('[register] Session creation failed (non-fatal):', e.message);
  }

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: assignedRole,
        isVerified: user.is_verified,
      },
      tokens,
    },
  });
};

// ---------- LOGIN ----------

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  let userRow;
  let rolesRows = [];
  try {
    if (poolReady) {
      const result = await pool.query(
        `SELECT u.*, array_agg(r.name) as roles, array_agg(r.permissions) as permissions
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.email = $1
         GROUP BY u.id`,
        [email]
      );
      userRow = result.rows[0];
    } else {
      // Supabase REST: fetch user
      const userRes = await supabaseQuery('users', {
        select: '*',
        filters: { email },
        limit: 1,
      });
      userRow = userRes?.rows?.[0];

      // Fetch roles separately (no JOIN in REST)
      if (userRow) {
        const rolesRes = await supabaseQuery('user_roles', {
          select: 'role_id,roles!inner(name,permissions)',
          filters: { user_id: userRow.id },
        });
        rolesRows = rolesRes?.rows || [];
      }
    }
  } catch (dbErr) {
    console.error('[login] Database query failed:', dbErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (!userRow) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  if (!userRow.is_active) {
    throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  let isValid;
  try {
    isValid = await comparePassword(password, userRow.password_hash);
  } catch (hashErr) {
    console.error('[login] Password comparison failed:', hashErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (!isValid) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  // Build roles/permissions from row (PG) or separate query (Supabase)
  const roles = userRow.roles || rolesRows.map(r => (r.roles || [{}])[0]?.name || 'student');
  const permissions = userRow.permissions || rolesRows.map(r => (r.roles || [{}])[0]?.permissions || {});
  const primaryRole = roles[0] || USER_ROLES.STUDENT;

  // Update last login
  try {
    if (poolReady) {
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userRow.id]);
    } else {
      await supabaseUpdate('users', { last_login_at: new Date().toISOString() }, { id: userRow.id });
    }
  } catch (e) {
    console.warn('[login] Last login update failed:', e.message);
  }

  const tokens = generateTokens({
    id: userRow.id,
    email: userRow.email,
    role: primaryRole,
    permissions,
  });

  try {
    const expiresDays = rememberMe ? 30 : 7;
    if (poolReady) {
      await pool.query(
        `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${expiresDays} days')`,
        [userRow.id, hashToken(tokens.accessToken), hashToken(tokens.refreshToken), req.body.deviceInfo, req.ip, req.get('user-agent')]
      );
    } else {
      await supabaseInsert('sessions', {
        user_id: userRow.id,
        token_hash: hashToken(tokens.accessToken),
        refresh_token_hash: hashToken(tokens.refreshToken),
        device_info: req.body.deviceInfo || null,
        ip_address: req.ip,
        user_agent: req.get('user-agent') || '',
        expires_at: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  } catch (e) {
    console.warn('[login] Session creation failed:', e.message);
  }

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: userRow.id,
        email: userRow.email,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        middleName: userRow.middle_name,
        dateOfBirth: userRow.date_of_birth,
        gender: userRow.gender,
        avatarUrl: userRow.avatar_url,
        isVerified: userRow.is_verified,
        role: primaryRole,
        permissions,
        createdAt: userRow.created_at,
      },
      tokens,
    },
  });
};

// ---------- REFRESH TOKEN ----------

export const refreshToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No refresh token provided', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const refreshToken = authHeader.split(' ')[1];
  const tokenHash = hashToken(refreshToken);

  let sessionRow;
  try {
    if (poolReady) {
      const result = await pool.query(
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
      sessionRow = result.rows[0];
    } else {
      const sessionRes = await supabaseQuery('sessions', {
        select: '*',
        filters: { refresh_token_hash: tokenHash, expires_at: { op: 'gt', val: new Date().toISOString() } },
        limit: 1,
      });
      const sessionData = sessionRes?.rows?.[0];
      if (sessionData) {
        const userRes = await supabaseQuery('users', {
          select: 'id,email,first_name,last_name,is_active',
          filters: { id: sessionData.user_id },
          limit: 1,
        });
        const userData = userRes?.rows?.[0] || {};
        const rolesRes = await supabaseQuery('user_roles', {
          select: 'roles!inner(name,permissions)',
          filters: { user_id: sessionData.user_id },
        });
        sessionRow = { ...sessionData, ...userData, roles: rolesRes?.rows?.map(r => (r.roles || [{}])[0]) || [] };
      }
    }
  } catch (dbErr) {
    console.error('[refreshToken] DB error:', dbErr.message);
    throw new AppError('Service unavailable.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (!sessionRow) {
    throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  if (!sessionRow.is_active) {
    throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  // Delete old session
  try {
    if (poolReady) {
      await pool.query('DELETE FROM sessions WHERE id = $1', [sessionRow.id]);
    } else {
      await supabaseDelete('sessions', { id: sessionRow.id });
    }
  } catch (e) {
    console.warn('[refreshToken] Session delete failed:', e.message);
  }

  const roles = sessionRow.roles?.map(r => r.name) || [];
  const permissions = sessionRow.roles?.[0]?.permissions || {};
  const primaryRole = roles[0] || USER_ROLES.STUDENT;

  const tokens = generateTokens({
    id: sessionRow.user_id,
    email: sessionRow.email,
    role: primaryRole,
    permissions,
  });

  try {
    if (poolReady) {
      await pool.query(
        `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')`,
        [sessionRow.user_id, hashToken(tokens.accessToken), hashToken(tokens.refreshToken), req.body.deviceInfo, req.ip, req.get('user-agent')]
      );
    } else {
      await supabaseInsert('sessions', {
        user_id: sessionRow.user_id,
        token_hash: hashToken(tokens.accessToken),
        refresh_token_hash: hashToken(tokens.refreshToken),
        device_info: req.body.deviceInfo || null,
        ip_address: req.ip,
        user_agent: req.get('user-agent') || '',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  } catch (e) {
    console.warn('[refreshToken] Session create failed:', e.message);
  }

  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed',
    data: { tokens },
  });
};

// ---------- LOGOUT ----------

export const logout = async (req, res) => {
  try {
    if (req.token) {
      const tokenHash = hashToken(req.token);
      if (poolReady) {
        await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
      } else {
        await supabaseDelete('sessions', { token_hash: tokenHash });
      }
    }
  } catch (e) {
    console.warn('[logout] Delete session failed:', e.message);
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

export const logoutAll = async (req, res) => {
  try {
    if (poolReady) {
      await pool.query('DELETE FROM sessions WHERE user_id = $1', [req.user.id]);
    } else {
      await supabaseDelete('sessions', { user_id: req.user.id });
    }
  } catch (e) {
    console.warn('[logoutAll] Delete sessions failed:', e.message);
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out from all devices' });
};

// ---------- GET CURRENT USER ----------

export const getCurrentUser = async (req, res) => {
  let userRow;
  let rolesRows = [];
  try {
    if (poolReady) {
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
      userRow = result.rows[0];
    } else {
      const userRes = await supabaseQuery('users', {
        select: '*',
        filters: { id: req.user.id },
        limit: 1,
      });
      userRow = userRes?.rows?.[0];
      if (userRow) {
        const rolesRes = await supabaseQuery('user_roles', {
          select: 'roles!inner(name,permissions)',
          filters: { user_id: req.user.id },
        });
        rolesRows = rolesRes?.rows || [];
      }
    }
  } catch (dbErr) {
    console.error('[getCurrentUser] DB error:', dbErr.message);
    throw new AppError('Service unavailable.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (!userRow) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const roles = userRow.roles || rolesRows.map(r => (r.roles || [{}])[0]?.name || 'student');
  const permissions = userRow.permissions || rolesRows.map(r => (r.roles || [{}])[0]?.permissions || {});

  res.json({
    success: true,
    data: {
      user: {
        id: userRow.id,
        email: userRow.email,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        middleName: userRow.middle_name,
        dateOfBirth: userRow.date_of_birth,
        gender: userRow.gender,
        avatarUrl: userRow.avatar_url,
        isVerified: userRow.is_verified,
        isActive: userRow.is_active,
        lastLoginAt: userRow.last_login_at,
        createdAt: userRow.created_at,
        roles,
        permissions,
      },
    },
  });
};

// ---------- VERIFY EMAIL ----------

export const verifyEmail = async (req, res) => {
  const { id } = req.params;
  const token = req.body.token;
  const tokenHash = hashToken(token);

  let userRow;
  try {
    if (poolReady) {
      const result = await pool.query(
        'SELECT u.* FROM users u WHERE u.id = $1 AND u.is_verified = FALSE',
        [id]
      );
      userRow = result.rows[0];
    } else {
      const res2 = await supabaseQuery('users', {
        select: '*',
        filters: { id, is_verified: false },
        limit: 1,
      });
      userRow = res2?.rows?.[0];
    }
  } catch (dbErr) {
    console.error('[verifyEmail] DB error:', dbErr.message);
    throw new AppError('Service unavailable.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  if (!userRow) {
    throw new AppError('Invalid verification request', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  try {
    if (poolReady) {
      await pool.query(
        'UPDATE users SET is_verified = TRUE, email_verified_at = NOW() WHERE id = $1',
        [id]
      );
    } else {
      await supabaseUpdate('users', { is_verified: true, email_verified_at: new Date().toISOString() }, { id });
    }
  } catch (e) {
    console.error('[verifyEmail] Update failed:', e.message);
    throw new AppError('Service unavailable.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  res.json({ success: true, message: 'Email verified successfully' });
};

// ---------- RESEND VERIFICATION ----------

export const resendVerification = async (req, res) => {
  const user = req.user;

  if (user.is_verified) {
    throw new AppError('Email already verified', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const verificationToken = await generateSecureToken();
  const verificationTokenHash = hashToken(verificationToken);

  try {
    if (poolReady) {
      await pool.query(
        'UPDATE users SET email_verification_token = $1 WHERE id = $2',
        [verificationTokenHash, user.id]
      );
    } else {
      await supabaseUpdate('users', { email_verification_token: verificationTokenHash }, { id: user.id });
    }
  } catch (e) {
    console.error('[resendVerification] Update failed:', e.message);
    throw new AppError('Service unavailable.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  console.log(`Resent verification token for ${user.email}: ${verificationToken}`);
  res.json({ success: true, message: 'Verification email sent' });
};
