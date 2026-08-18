export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  repliesCount: number;
  likesCount: number;
  likes?: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  memberCount: number;
  isPublic: boolean;
  creatorId: string;
  creatorName: string;
  createdAt: string;
}

export interface QnAQuestion {
  id: string;
  question: string;
  details: string;
  subject: string;
  tags: string[];
  authorId: string;
  authorName: string;
  answersCount: number;
  votes: number;
  isResolved: boolean;
  createdAt: string;
}
