import { query } from '../../common/database/index.js';
import studentPointModel from '../models/studentPoint.model.js';
import badgeModel from '../models/badge.model.js';
import achievementModel from '../models/achievement.model.js';
import rewardModel from '../models/reward.model.js';
import pointsHistoryModel from '../models/pointsHistory.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const ACTION_POINTS = {
  lesson_completed: 10,
  quiz_completed: 15,
  exam_completed: 50,
  perfect_score: 100,
  first_login: 10,
  profile_complete: 20,
  streak_7: 50,
  course_completed: 100,
  question_answered: 2,
  social_share: 5,
};

export const gamificationService = {
  async getMyPoints(userId) {
    const points = await studentPointModel.findByUserId(userId);
    if (!points) return { totalPoints: 0, dailyPoints: 0, weeklyPoints: 0, monthlyPoints: 0, level: 1 };

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [daily, weekly, monthly] = await Promise.all([
      query(`SELECT COALESCE(SUM(points), 0)::int AS total FROM points_history WHERE user_id = $1 AND DATE(created_at) = $2`, [userId, today]),
      query(`SELECT COALESCE(SUM(points), 0)::int AS total FROM points_history WHERE user_id = $1 AND DATE(created_at) >= $2`, [userId, weekAgo]),
      query(`SELECT COALESCE(SUM(points), 0)::int AS total FROM points_history WHERE user_id = $1 AND DATE(created_at) >= $2`, [userId, monthAgo]),
    ]);

    const level = points.total_points >= 1000 ? 10 : points.total_points >= 500 ? 5 : points.total_points >= 100 ? 3 : points.total_points >= 50 ? 2 : 1;

    return {
      id: points.id,
      userId: points.user_id,
      totalPoints: points.total_points,
      dailyPoints: parseInt(daily.rows[0].total),
      weeklyPoints: parseInt(weekly.rows[0].total),
      monthlyPoints: parseInt(monthly.rows[0].total),
      level,
      createdAt: points.created_at,
      updatedAt: points.updated_at,
    };
  },

  async awardPoints(userId, action, customPoints, description) {
    const points = customPoints || ACTION_POINTS[action] || 10;
    const desc = description || `${action.replace(/_/g, ' ')}: +${points} XP`;

    await Promise.all([
      studentPointModel.addPoints(userId, points),
      pointsHistoryModel.create({ userId, action, points, description: desc }),
    ]);

    await achievementModel.checkAndAward(userId);

    return this.getMyPoints(userId);
  },

  async getLeaderboard({ page = 1, limit = 50 } = {}) {
    const result = await studentPointModel.getLeaderboard({ page, limit });
    return {
      data: result.data.map((p, i) => ({
        userId: p.user_id,
        userName: `${p.first_name} ${p.last_name}`,
        points: p.total_points,
        rank: (page - 1) * limit + i + 1,
        avatar: p.avatar_url,
      })),
      pagination: result.pagination,
    };
  },

  async getBadges() {
    const badges = await badgeModel.list();
    return { badges };
  },

  async getMyBadges(userId, { page = 1, limit = 20 } = {}) {
    const achievements = await achievementModel.listByUser(userId);
    const offset = (page - 1) * limit;
    const paginated = achievements.slice(offset, offset + limit);
    return {
      data: paginated.map(a => ({
        id: a.id,
        badgeId: a.badge_id,
        userId: a.user_id,
        badge: { name: a.name, description: a.description, icon: a.icon_url, xpReward: a.xp_reward },
        earnedAt: a.earned_at,
      })),
      pagination: { page, limit, total: achievements.length, totalPages: Math.ceil(achievements.length / limit) },
    };
  },

  async getAchievements() {
    const badges = await badgeModel.list();
    return { achievements: badges.map(b => ({ id: b.id, name: b.name, description: b.description, icon: b.icon_url, criteria: b.criteria, points: b.xp_reward, isActive: b.is_active })) };
  },

  async getMyAchievements(userId, { page = 1, limit = 20 } = {}) {
    const achievements = await achievementModel.listByUser(userId);
    const offset = (page - 1) * limit;
    const paginated = achievements.slice(offset, offset + limit);
    return {
      data: paginated.map(a => ({
        id: a.id,
        achievementId: a.badge_id,
        userId: a.user_id,
        achievement: { name: a.name, description: a.description, icon: a.icon_url, criteria: a.criteria, points: a.xp_reward },
        progress: 100,
        target: 100,
        completedAt: a.earned_at,
      })),
      pagination: { page, limit, total: achievements.length, totalPages: Math.ceil(achievements.length / limit) },
    };
  },

  async getStreak(userId) {
    const points = await studentPointModel.findByUserId(userId);
    if (!points) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakStartDate: null };

    const lastSession = await query(
      `SELECT MAX(DATE(started_at)) AS last_date FROM study_sessions WHERE student_id = $1`,
      [userId]
    );
    const lastActivityDate = lastSession.rows[0]?.last_date || null;

    const streakResult = await query(
      `WITH dates AS (
         SELECT DISTINCT DATE(started_at) AS d
         FROM study_sessions
         WHERE student_id = $1
         ORDER BY d DESC
       ),
       streak_calc AS (
         SELECT d,
                LAG(d) OVER (ORDER BY d) AS prev_d,
                ROW_NUMBER() OVER (ORDER BY d DESC) AS rn
         FROM dates
       )
       SELECT COUNT(*)::int AS streak
       FROM streak_calc
       WHERE prev_d = d - INTERVAL '1 day' OR prev_d IS NULL`,
      [userId]
    );

    return {
      currentStreak: parseInt(points.current_streak || 0),
      longestStreak: parseInt(points.longest_streak || 0),
      lastActivityDate,
      streakStartDate: lastActivityDate ? new Date(lastActivityDate - (points.current_streak - 1) * 86400000).toISOString().split('T')[0] : null,
    };
  },

  async getRewards() {
    const rewards = await rewardModel.list();
    return { rewards };
  },

  async getMyRewards(userId, { page = 1, limit = 20 } = {}) {
    return rewardModel.listUserRewards(userId, { page, limit });
  },

  async redeemReward(userId, rewardId) {
    const result = await rewardModel.redeem(userId, rewardId);
    if (!result) throw new AppError('Insufficient points or reward unavailable', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    return { success: true };
  },

  async getPointsHistory(userId, { page = 1, limit = 20 } = {}) {
    return pointsHistoryModel.listByUser(userId, { page, limit });
  },
};

export default gamificationService;