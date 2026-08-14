export interface Badge {
  id: string;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
  criteria: Record<string, unknown>;
  xpReward: number;
  isActive: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  metadata: Record<string, unknown>;
}

export interface StudentPoint {
  id: string;
  userId: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xpToNextLevel: number;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  type: string;
  period: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rank: number;
  points: number;
  stats: Record<string, unknown>;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}
