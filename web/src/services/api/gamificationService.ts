import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';
import { getSupabase } from '@/lib/supabase';

const { baseUrl } = apiConfig;

// ========== POINTS & XP ==========

export interface UserPoints {
  id: string;
  userId: string;
  totalPoints: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export const fetchMyPoints = async (_token: string): Promise<{ points: UserPoints }> => {
  const supabase = getSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('You must be signed in');
  const { data, error } = await supabase.from('student_points').select('*').eq('user_id', auth.user.id).maybeSingle();
  if (error) throw new Error(error.message);
  const now = new Date().toISOString();
  return { points: {
    id: data?.id || auth.user.id,
    userId: auth.user.id,
    totalPoints: Number(data?.total_points || 0),
    dailyPoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    level: Number(data?.level || 1),
    createdAt: data?.updated_at || now,
    updatedAt: data?.updated_at || now,
  } };
};

export const fetchLeaderboard = async (
  page: number = 1,
  limit: number = 50,
  token?: string
): Promise<PaginatedResponse<{ userId: string; userName: string; points: number; rank: number; avatar?: string }>> => {
  const response = await fetch(`${baseUrl}/gamification/leaderboard?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== BADGES ==========

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: 'learning' | 'achievement' | 'social' | 'special';
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  userId: string;
  badge: Badge;
  earnedAt: string;
}

export const fetchBadges = async (token?: string): Promise<{ badges: Badge[] }> => {
  const response = await fetch(`${baseUrl}/gamification/badges`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchMyBadges = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<UserBadge>> => {
  const response = await fetch(`${baseUrl}/gamification/badges/me?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== ACHIEVEMENTS ==========

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, unknown>;
  points: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  achievement: Achievement;
  progress: number;
  target: number;
  completedAt?: string;
}

export const fetchAchievements = async (token?: string): Promise<{ achievements: Achievement[] }> => {
  const response = await fetch(`${baseUrl}/gamification/achievements`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchMyAchievements = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<UserAchievement>> => {
  const response = await fetch(`${baseUrl}/gamification/achievements/me?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== STREAKS ==========

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakStartDate: string;
}

export const fetchMyStreak = async (_token: string): Promise<{ streak: StudyStreak }> => {
  const supabase = getSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('You must be signed in');
  const { data, error } = await supabase.from('student_points').select('current_streak,longest_streak,updated_at').eq('user_id', auth.user.id).maybeSingle();
  if (error) throw new Error(error.message);
  const date = String(data?.updated_at || '');
  return { streak: {
    currentStreak: Number(data?.current_streak || 0),
    longestStreak: Number(data?.longest_streak || 0),
    lastActivityDate: date,
    streakStartDate: date,
  } };
};

// ========== REWARDS ==========

export interface Reward {
  id: string;
  name: string;
  description: string;
  image: string;
  pointsCost: number;
  quantityAvailable: number;
  isActive: boolean;
}

export interface UserReward {
  id: string;
  rewardId: string;
  userId: string;
  reward: Reward;
  redeemedAt: string;
  status: 'pending' | 'delivered' | 'expired';
}

export const fetchRewards = async (token?: string): Promise<{ rewards: Reward[] }> => {
  const response = await fetch(`${baseUrl}/gamification/rewards`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchMyRewards = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<UserReward>> => {
  const response = await fetch(`${baseUrl}/gamification/rewards/me?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const redeemReward = async (rewardId: string, token: string) => {
  const response = await fetch(`${baseUrl}/gamification/rewards/${rewardId}/redeem`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== POINTS HISTORY ==========

export interface PointsHistory {
  id: string;
  userId: string;
  action: string;
  points: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const fetchPointsHistory = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<PointsHistory>> => {
  const response = await fetch(`${baseUrl}/gamification/points/history?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
