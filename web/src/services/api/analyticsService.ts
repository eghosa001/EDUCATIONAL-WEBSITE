import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

// ========== PLATFORM ANALYTICS (Admin) ==========

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalQuestions: number;
  totalExams: number;
  totalSubscriptions: number;
  monthlyRevenue: number;
  userGrowth: number;
  courseCompletionRate: number;
}

export const fetchPlatformStats = async (token: string): Promise<{ stats: PlatformStats }> => {
  const response = await fetch(`${baseUrl}/analytics/platform`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== USER ANALYTICS ==========

export interface UserAnalytics {
  totalSessions: number;
  totalStudyTime: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  examsTaken: number;
  averageExamScore: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}

export const fetchUserAnalytics = async (token: string): Promise<{ analytics: UserAnalytics }> => {
  const response = await fetch(`${baseUrl}/analytics/users/me`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== COURSE ANALYTICS ==========

export interface CourseAnalytics {
  enrollmentCount: number;
  completionRate: number;
  averageProgress: number;
  totalLessons: number;
  completedLessons: number;
  averageRating: number;
  reviewCount: number;
  popularLessons: Array<{ lessonId: string; title: string; viewCount: number }>;
}

export const fetchCourseAnalytics = async (courseId: string, token: string): Promise<{ analytics: CourseAnalytics }> => {
  const response = await fetch(`${baseUrl}/analytics/courses/${courseId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== EXAM ANALYTICS ==========

export interface ExamAnalytics {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  difficultyDistribution: Record<string, number>;
  questionPerformance: Array<{ questionId: string; correctCount: number; incorrectCount: number }>;
}

export const fetchExamAnalytics = async (examId: string, token: string): Promise<{ analytics: ExamAnalytics }> => {
  const response = await fetch(`${baseUrl}/analytics/exams/${examId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== LEARNING ANALYTICS ==========

export interface LearningAnalytics {
  timeSpentBySubject: Record<string, number>;
  performanceBySubject: Record<string, { averageScore: number; completionRate: number }>;
  activityByDay: Record<string, { date: string; studyTime: number; lessonsCompleted: number }>;
  popularTopics: Array<{ topicId: string; topicName: string; timeSpent: number }>;
  weakAreas: Array<{ topicId: string; topicName: string; averageScore: number }>;
}

export const fetchLearningAnalytics = async (token: string): Promise<{ analytics: LearningAnalytics }> => {
  const response = await fetch(`${baseUrl}/analytics/learning/me`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== REVENUE ANALYTICS (Admin) ==========

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueBySource: Record<string, number>;
  subscriptionBreakdown: Record<string, { count: number; revenue: number }>;
  activeSubscriptions: number;
  churnRate: number;
}

export const fetchRevenueAnalytics = async (token: string): Promise<{ analytics: RevenueAnalytics }> => {
  const response = await fetch(`${baseUrl}/analytics/revenue`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== CONTENT ANALYTICS ==========

export interface ContentAnalytics {
  mostViewedCourses: Array<{ courseId: string; title: string; viewCount: number }>;
  mostPopularLessons: Array<{ lessonId: string; title: string; viewCount: number }>;
  highestRatedCourses: Array<{ courseId: string; title: string; rating: number }>;
  mostAttemptedExams: Array<{ examId: string; title: string; attemptCount: number }>;
}

export const fetchContentAnalytics = async (token: string): Promise<{ analytics: ContentAnalytics }> => {
  const response = await fetch(`${baseUrl}/analytics/content`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== TIME SERIES ANALYTICS ==========

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface TimeSeriesAnalytics {
  userSignups: TimeSeriesData[];
  courseEnrollments: TimeSeriesData[];
  examAttempts: TimeSeriesData[];
  revenue: TimeSeriesData[];
  activeUsers: TimeSeriesData[];
}

export const fetchTimeSeriesAnalytics = async (
  startDate: string,
  endDate: string,
  token: string
): Promise<{ analytics: TimeSeriesAnalytics }> => {
  const response = await fetch(
    `${baseUrl}/analytics/time-series?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

// ========== EXPORT ANALYTICS ==========

export const exportAnalyticsReport = async (
  reportType: 'users' | 'courses' | 'exams' | 'revenue' | 'activity',
  format: 'csv' | 'excel' | 'pdf',
  token: string,
  startDate?: string,
  endDate?: string
) => {
  const query = new URLSearchParams({ reportType, format });
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  const response = await fetch(`${baseUrl}/analytics/export?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
