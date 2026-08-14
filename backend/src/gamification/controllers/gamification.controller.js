import { gamificationService } from '../services/gamification.service.js';

export const getMyPoints = async (req, res) => {
  const points = await gamificationService.getMyPoints(req.user.id);
  res.json({ success: true, data: { points } });
};

export const awardPoints = async (req, res) => {
  const { action, points, description } = req.body;
  const result = await gamificationService.awardPoints(req.user.id, action, points, description);
  res.json({ success: true, data: { points: result } });
};

export const getLeaderboard = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await gamificationService.getLeaderboard({ page, limit });
  res.json({ success: true, data: { leaderboard: data }, pagination });
};

export const getBadges = async (req, res) => {
  const { badges } = await gamificationService.getBadges();
  res.json({ success: true, data: { badges } });
};

export const getMyBadges = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await gamificationService.getMyBadges(req.user.id, { page, limit });
  res.json({ success: true, data: { badges: data }, pagination });
};

export const getAchievements = async (req, res) => {
  const { achievements } = await gamificationService.getAchievements();
  res.json({ success: true, data: { achievements } });
};

export const getMyAchievements = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await gamificationService.getMyAchievements(req.user.id, { page, limit });
  res.json({ success: true, data: { achievements: data }, pagination });
};

export const getMyStreak = async (req, res) => {
  const streak = await gamificationService.getStreak(req.user.id);
  res.json({ success: true, data: { streak } });
};

export const getRewards = async (req, res) => {
  const { rewards } = await gamificationService.getRewards();
  res.json({ success: true, data: { rewards } });
};

export const getMyRewards = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await gamificationService.getMyRewards(req.user.id, { page, limit });
  res.json({ success: true, data: { rewards: data }, pagination });
};

export const redeemReward = async (req, res) => {
  await gamificationService.redeemReward(req.user.id, req.params.rewardId);
  res.json({ success: true, message: 'Reward redeemed successfully' });
};

export const getPointsHistory = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await gamificationService.getPointsHistory(req.user.id, { page, limit });
  res.json({ success: true, data: { history: data }, pagination });
};