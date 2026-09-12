import { pool } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const ADMIN_ROLES = new Set(['super_admin', 'content_admin']);

const assertSelfOrAdmin = (req, id) => {
  const roles = new Set([req.user?.role, ...(req.user?.roles || [])].filter(Boolean));
  if (req.user?.id !== id && ![...roles].some((role) => ADMIN_ROLES.has(role))) {
    throw new AppError('Not authorized to access this user', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
};

export const getUserAchievements = async (req, res) => {
  const { id } = req.params;
  assertSelfOrAdmin(req, id);

  const result = await pool.query(
    `SELECT a.id AS achievement_id,
            a.earned_at,
            a.metadata,
            b.id AS badge_id,
            b.name,
            b.code,
            b.description,
            b.icon_url,
            b.xp_reward
       FROM achievements a
       JOIN badges b ON b.id = a.badge_id
      WHERE a.user_id = $1
      ORDER BY a.earned_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      achievements: result.rows.map((row) => ({
        id: row.achievement_id,
        badgeId: row.badge_id,
        name: row.name,
        code: row.code,
        description: row.description,
        iconUrl: row.icon_url,
        xpReward: row.xp_reward,
        earnedAt: row.earned_at,
        metadata: row.metadata || {},
      })),
    },
  });
};

export default { getUserAchievements };
