export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  criteriaValue: number;
  earned?: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  badgeId: string;
  userId: string;
  earnedAt: string;
  badge?: Badge;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser?: boolean;
}
