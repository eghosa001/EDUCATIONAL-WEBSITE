'use client';

import { useEffect, useState } from 'react';
import { useGamificationStore } from '@/features/gamification/store/gamificationStore';

export function useGamification() {
  const { userXP, userLevel, badges, achievements, leaderboard, isLoading, error, fetchUserData, fetchBadges, fetchAchievements, fetchLeaderboard, addXP, getXPToNextLevel, getProgressToNextLevel } = useGamificationStore();

  useEffect(() => {
    fetchUserData();
    fetchBadges();
    fetchAchievements();
    fetchLeaderboard();
  }, []);

  const progressToNextLevel = getProgressToNextLevel();
  const xpToNextLevel = getXPToNextLevel();

  return {
    userXP,
    userLevel,
    badges,
    achievements,
    leaderboard,
    progressToNextLevel,
    xpToNextLevel,
    isLoading,
    error,
    addXP,
  };
}

export function useBadges() {
  const { badges, fetchBadges } = useGamificationStore();

  useEffect(() => {
    fetchBadges();
  }, []);

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return { earnedBadges, lockedBadges, badges };
}

export function useLeaderboard() {
  const { leaderboard, fetchLeaderboard } = useGamificationStore();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period]);

  const userRank = leaderboard.find((entry) => entry.isCurrentUser)?.rank || '-';

  return { leaderboard, period, setPeriod, userRank };
}
