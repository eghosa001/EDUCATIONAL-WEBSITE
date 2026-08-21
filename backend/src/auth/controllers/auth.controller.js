import { pool, supabaseQuery, supabaseInsert, supabaseUpdate, supabaseDelete, useSupabase } from '../../common/database/index.js';
import { generateTokens, hashPassword, comparePassword, hashToken, generateSecureToken, decodeToken } from '../utils/jwt.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { USER_ROLES, USER_STATUS } from '../../common/constants/index.js';

// ---------- helpers ----------

const SECURE = process.env.NODE_ENV === 'production';

const setAuthCookies = (res, accessToken, refreshToken) => {
  const maxAgeAccess = 15 * 60 * 1000;
  const maxAgeRefresh = 7 * 24 * 60 * 60 * 1000;
  res.cookie('access_token', accessToken, { httpOnly: true, secure: SECURE, sameSite: 'lax', maxAge: maxAgeAccess, path: '/' });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: SECURE, sameSite: 'lax', maxAge: maxAgeRefresh, path: '/' });
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
};

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

  let existingUser;
  try {
    if (!useSupabase) {
      existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
      );
    } else {
      // PostgREST's OR syntax is easy to break when values contain special
      // characters. Use two simple filters instead; this is also more reliable
      // across Supabase/PostgREST versions.
      const emailResult = await supabaseQuery('users', {
        select: 'id',
        filters: { email },
        limit: 1,
      });
      const phoneResult = phone
        ? await supabaseQuery('users', { select: 'id', filters: { phone }, limit: 1 })
        : { rows: [] };
      existingUser = { rows: [...emailResult.rows, ...phoneResult.rows] };
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
    const result = !useSupabase
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

  const validRoles = ['student', 'teacher', 'parent'];
  const assignedRole = validRoles.includes(role) ? role : USER_ROLES.STUDENT;

  try {
    const roleResult = !useSupabase
      ? await pool.query('SELECT id FROM roles WHERE name = $1', [assignedRole])
      : await supabaseQuery('roles', { select: 'id', filters: { name: assignedRole }, limit: 1 });

    if (roleResult?.rows?.length > 0) {
      await (!useSupabase
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
    await (!useSupabase
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
    if (!useSupabase) {
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
      const userRes = await supabaseQuery('users', { select: '*', filters: { email }, limit: 1 });
      userRow = userRes?.rows?.[0];
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

  if (!userRow) throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  if (!userRow.is_active) throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);

  let isValid;
  try {
    isValid = await comparePassword(password, userRow.password_hash);
  } catch (hashErr) {
    console.error('[login] Password comparison failed:', hashErr.message);
    throw new AppError('Service unavailable. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
  if (!isValid) throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);

  const roles = userRow.roles || rolesRows.map(r => (r.roles || {}).name || 'student');
  const permissions = userRow.permissions || rolesRows.map(r => (r.roles || {}).permissions || {});
  const primaryRole = roles[0] || USER_ROLES.STUDENT;

  try {
    if (!useSupabase) {
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userRow.id]);
    } else {
      await supabaseUpdate('users', { last_login_at: new Date().toISOString() }, { id: userRow.id });
    }
  } catch (e) {
    console.warn('[login] Last login update failed:', e.message);
  }

  const tokens = generateTokens({ id: userRow.id, email: userRow.email, role: primaryRole, permissions });

  try {
    const expiresDays = rememberMe ? 30 : 7;
    const sessionData = {
      user_id: userRow.id,
      token_hash: hashToken(tokens.accessToken),
      refresh_token_hash: hashToken(tokens.refreshToken),
      device_info: req.body.deviceInfo || null,
      ip_address: req.ip,
      user_agent: req.get('user-agent') || '',
      expires_at: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString(),
    };
    await (!useSupabase
      ? pool.query(
          `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${expiresDays} days')`,
          [userRow.id, sessionData.token_hash, sessionData.refresh_token_hash, req.body.deviceInfo, req.ip, req.get('user-agent')]
        )
      : supabaseInsert('sessions', sessionData));
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

// NOTE: refreshToken, logout, logoutAll, getCurrentUser, verifyEmail and
// resendVerification remain below unchanged in this controller.
