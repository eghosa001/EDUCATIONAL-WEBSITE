import { pool } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { USER_ROLES } from '../../common/constants/index.js';

export const listUsers = async (req, res) => {
  const { page, limit, search, sort } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE u.is_active = TRUE';
  const params = [];
  let paramIndex = 1;

  if (search) {
    whereClause += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const orderBy = sort ? sort.replace(':', ' ') : 'u.created_at DESC';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.middle_name, u.avatar_url,
            u.is_verified, u.is_active, u.last_login_at, u.created_at,
            array_agg(r.name) as roles
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     ${whereClause}
     GROUP BY u.id
     ORDER BY ${orderBy}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: {
      users: result.rows.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        middleName: u.middle_name,
        avatarUrl: u.avatar_url,
        isVerified: u.is_verified,
        isActive: u.is_active,
        lastLoginAt: u.last_login_at,
        createdAt: u.created_at,
        roles: u.roles || [],
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
};

export const getUserById = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.middle_name, u.date_of_birth,
            u.gender, u.avatar_url, u.is_verified, u.is_active, u.last_login_at, u.created_at,
            array_agg(r.name) as roles, array_agg(r.permissions) as permissions
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

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

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = ['first_name', 'last_name', 'middle_name', 'phone', 'date_of_birth', 'gender', 'avatar_url', 'is_active'];
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(snakeKey)) {
      fields.push(`${snakeKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new AppError('No valid fields to update', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  res.json({ success: true, message: 'User updated successfully' });
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);

  res.json({ success: true, message: 'User deactivated successfully' });
};

export const getUserProfile = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT u.*, 
            (SELECT json_agg(json_build_object('id', c.id, 'title', c.title, 'slug', c.slug, 'thumbnail_url', c.thumbnail_url))
             FROM courses c WHERE c.teacher_id = u.id) as taught_courses,
            (SELECT json_agg(json_build_object('id', sc.course_id, 'progress', sc.progress_percentage, 'enrolled_at', sc.enrolled_at))
             FROM student_courses sc WHERE sc.student_id = u.id) as enrolled_courses
     FROM users u WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        middleName: user.middle_name,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        taughtCourses: user.taught_courses || [],
        enrolledCourses: user.enrolled_courses || [],
      },
    },
  });
};

export const updateProfile = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.user.id !== id && !req.user.permissions?.includes('users:update')) {
    throw new AppError('Not authorized to update this profile', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = ['first_name', 'last_name', 'middle_name', 'phone', 'date_of_birth', 'gender', 'avatar_url'];
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(snakeKey)) {
      fields.push(`${snakeKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new AppError('No valid fields to update', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  res.json({ success: true, message: 'Profile updated successfully' });
};

export const getUserCourses = async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT sc.*, c.title, c.slug, c.thumbnail_url, c.difficulty, c.total_duration_hours
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.id
     WHERE sc.student_id = $1
     ORDER BY sc.enrolled_at DESC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM student_courses WHERE student_id = $1',
    [id]
  );

  res.json({
    success: true,
    data: {
      courses: result.rows.map(c => ({
        id: c.course_id,
        title: c.title,
        slug: c.slug,
        thumbnailUrl: c.thumbnail_url,
        difficulty: c.difficulty,
        totalDurationHours: c.total_duration_hours,
        progressPercentage: c.progress_percentage,
        enrolledAt: c.enrolled_at,
        completedAt: c.completed_at,
      })),
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
      },
    },
  });
};

export const getUserProgress = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT s.name as subject_name, s.code as subject_code,
            COUNT(DISTINCT lp.lesson_id) as lessons_completed,
            COUNT(DISTINCT l.id) as total_lessons,
            AVG(lp.progress_percentage) as avg_progress,
            SUM(lp.watch_time_seconds) as total_watch_time
     FROM lesson_progress lp
     JOIN lessons l ON lp.lesson_id = l.id
     JOIN courses c ON l.course_id = c.id
     JOIN subjects s ON c.subject_id = s.id
     WHERE lp.student_id = $1 AND lp.status = 'completed'
     GROUP BY s.id, s.name, s.code
     ORDER BY avg_progress DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      progress: result.rows.map(r => ({
        subject: { name: r.subject_name, code: r.subject_code },
        lessonsCompleted: parseInt(r.lessons_completed, 10),
        totalLessons: parseInt(r.total_lessons, 10),
        averageProgress: parseFloat(r.avg_progress) || 0,
        totalWatchTimeHours: Math.round((parseInt(r.total_watch_time) || 0) / 3600 * 100) / 100,
      })),
    },
  });
};

export const getUserAchievements = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT a.*, sa.earned_at
     FROM student_achievements sa
     JOIN achievements a ON sa.achievement_id = a.id
     WHERE sa.student_id = $1
     ORDER BY sa.earned_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      achievements: result.rows.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        badgeColor: a.badge_color,
        category: a.category,
        earnedAt: a.earned_at,
      })),
    },
  });
};

export const assignRole = async (req, res) => {
  const { id } = req.params;
  const { roleId } = req.body;

  await pool.query(
    'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [id, roleId, req.user.id]
  );

  res.json({ success: true, message: 'Role assigned successfully' });
};

export const removeRole = async (req, res) => {
  const { id, roleId } = req.params;

  await pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [id, roleId]);

  res.json({ success: true, message: 'Role removed successfully' });
};