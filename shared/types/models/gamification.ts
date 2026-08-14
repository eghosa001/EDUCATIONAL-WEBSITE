export interface Badge {
  id: string;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
  criteria: Record<string, unknown>;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  badgeId?: string;
  title: string;
  description?: string;
  pointsAwarded: number;
  earnedAt: string;
}

export interface StudentPoint {
  id: string;
  studentId: string;
  points: number;
  source: string;
  referenceId?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  studentId: string;
  name: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  streakDays: number;
}
