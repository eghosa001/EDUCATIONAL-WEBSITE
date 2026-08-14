'use client';

import { TrophyIcon, FlameIcon, MedalIcon, BadgeCheckIcon } from 'lucide-react';

const achievements = [
  { id: '1', title: 'First Course', desc: 'Complete your first course', icon: BadgeCheckIcon, earned: true, xp: 100 },
  { id: '2', title: '7-Day Streak', desc: 'Study 7 days in a row', icon: FlameIcon, earned: true, xp: 200 },
  { id: '3', title: 'Quiz Master', desc: 'Score 90%+ on 5 quizzes', icon: TrophyIcon, earned: true, xp: 300 },
  { id: '4', title: 'Exam Champion', desc: 'Pass your first exam', icon: MedalIcon, earned: false, xp: 500 },
  { id: '5', title: '30-Day Streak', desc: 'Study 30 days in a row', icon: FlameIcon, earned: false, xp: 1000 },
  { id: '6', title: 'Top Scorer', desc: 'Rank #1 in any subject', icon: TrophyIcon, earned: false, xp: 750 },
];

const xpBar = 2750;
const nextLevelXp = 3500;
const level = 5;

export default function GamificationPage() {
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
            <p className="text-4xl font-bold">{xpBar.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(xpBar / nextLevelXp) * 100}%` }} />
        </div>
        <p className="text-sm text-indigo-200 mt-2">{nextLevelXp - xpBar} XP to Level {level + 1}</p>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.earned ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.earned ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <a.icon className={`w-5 h-5 ${a.earned ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.desc}</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">{a.earned ? '✓ Earned' : `${a.xp} XP`}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
