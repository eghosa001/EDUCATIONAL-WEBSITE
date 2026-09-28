'use client';

import { useEffect, useState } from 'react';
import { BadgeCheckIcon, FlameIcon, MedalIcon, TrophyIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchBadges,
  fetchMyBadges,
  fetchMyPoints,
  type Badge,
} from '@/services/api/gamificationService';

function iconForBadge(name: string) {
  if (/streak/i.test(name)) return FlameIcon;
  if (/exam|quiz|score|warrior|crusher/i.test(name)) return TrophyIcon;
  if (/community|profile/i.test(name)) return MedalIcon;
  return BadgeCheckIcon;
}

export default function GamificationPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      fetchMyPoints(authToken),
      fetchBadges(authToken),
      fetchMyBadges(1, 100, authToken),
    ])
      .then(([pointsRes, badgeRes, earnedRes]) => {
        if (cancelled) return;
        const totalPoints = pointsRes.points?.totalPoints ?? 0;
        setPoints(totalPoints);
        setLevel(Math.floor(totalPoints / 500) + 1);
        setBadges(badgeRes.badges || []);
        setEarnedIds(new Set((earnedRes.data || []).map(item => item.badgeId)));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load gamification data');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gamification</h1>
        <div className="flex items-center justify-center py-12 text-gray-500 dark:text-slate-300">Loading…</div>
      </div>
    );
  }

  const nextLevelXp = level * 500;
  const xpRemaining = Math.max(0, nextLevelXp - points);
  const progress = Math.min(100, Math.max(0, (points % 500) / 5));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gamification</h1>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-200">Current Level</p>
            <p className="text-4xl font-bold">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-200">Total XP</p>
            <p className="text-3xl font-bold">{points}</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/20">
          <div className="h-3 rounded-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-indigo-200">{xpRemaining} XP to Level {level + 1}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Achievements</h2>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-300">
            {earnedIds.size} of {badges.length} earned
          </span>
        </div>

        {badges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-300">
            No active achievements are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {badges.map(badge => {
              const earned = earnedIds.has(badge.id);
              const Icon = iconForBadge(badge.name);
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    earned
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                      : 'border-gray-200 bg-gray-50 opacity-70 dark:border-slate-700 dark:bg-[#151A3A]'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    earned ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-200 dark:bg-slate-700'
                  }`}>
                    <Icon className={`h-5 w-5 ${earned ? 'text-green-600 dark:text-green-300' : 'text-gray-400 dark:text-slate-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${earned ? 'text-green-900 dark:text-green-200' : 'text-gray-700 dark:text-slate-200'}`}>
                      {badge.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{badge.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-slate-400">+{badge.pointsRequired} XP</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
