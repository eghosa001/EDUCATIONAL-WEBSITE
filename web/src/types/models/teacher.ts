export interface TeacherCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  studentCount: number;
  enrollmentCount: number;
  revenue: number;
  averageRating: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

export interface TeacherAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  totalRevenue: number;
  averageCourseRating: number;
  courseCompletionRate: number;
  monthlyEarnings: Array<{ month: string; amount: number }>;
}

export interface TeacherDashboardData {
  totalStudents: number;
  activeCourses: number;
  totalRevenue: number;
  pendingReviews: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}
