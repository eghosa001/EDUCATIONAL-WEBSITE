'use client';

import { useEffect, useState } from 'react';
import { TrophyIcon, FlameIcon, MedalIcon, BadgeCheckIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';

const ACHIEVEMENTS = [
  { id: '1', title: 'First Course', desc: 'Complete your first course', icon: BadgeCheckIcon, xp: 100 },
  { id: '2', title: '7-Day Streak', desc: 'Study 7 days in a row', icon: FlameIcon, xp: 200 },
  { id: '3', title: 'Quiz Master', desc: 'Score 90%+ on 5 quizzes', icon: TrophyIcon, xp: 300 },
  { id: '4', title: 'Exam Champion', desc: 'Pass your first exam', icon: MedalIcon, xp: 500 },
  { id: '5', title: '30-Day Streak', desc: 'Study 30 days in a row', icon: FlameIcon, xp: 1000 },
  { id: '6', title: 'Top Scorer', desc: 'Rank #1 in any subject', icon: TrophyIcon, xp: 750 },
];

export default function GamificationPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) { setLoading(false); return; }

    Promise.all([
      fetch('http://localhost:3000/api/v1/gamification/points/me', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }).then(r => r.json()).catch(() => ({})),
      fetch('http://localhost:3000/api/v1/gamification/badges/me?limit=50', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }).then(r => r.json()).catch(() => ({})),
    ]).then(([pointsRes, badgesRes]) => {
      setPoints(pointsRes.data?.points ?? 0);
      const earned = new Set<string>((badgesRes.data || []).map((b: any) => b.id));
      setEarnedIds(earned);
      setLevel(Math.floor((pointsRes.data?.points ?? 0) / 500) + 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Gamification</h1>
        <div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>
      </div>
    );
  }

  const nextLevelXp = level * 500;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gamification</h1>

      {/* XP & Level */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-sm">Current Level</p>
            <p className="text-4xl font-bold">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm">Total XP</p>
            <p className="text-3xl font-bold">{points}</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-3">
          <div
            className="bg-yellow-400 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(100, (points % 500) / 5)}%` }}
          />
        </div>
        <p className="text-indigo-200 text-sm mt-2">
          {nextLevelXp - points} XP to Level {level + 1}
        </p>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map(a => {
            const earned = earnedIds.has(a.id);
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  earned ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  <Icon className={`w-5 h-5 ${earned ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${earned ? 'text-green-900' : 'text-gray-700'}`}>{a.title}</p>
                  <p className="text-xs text-gray-500">{a.desc}</p>
                </div>
                <span className="text-xs font-medium text-gray-400">+{a.xp} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
