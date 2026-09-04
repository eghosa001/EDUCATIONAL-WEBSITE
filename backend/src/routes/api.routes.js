import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { educationRoutes } from './education.routes.js';
import { curriculumRoutes } from './curriculum.routes.js';
import { courseRoutes } from './course.routes.js';
import { lessonRoutes } from './lesson.routes.js';
import { flashcardRoutes } from './flashcard.routes.js';
import { assessmentRoutes } from './assessment.routes.js';
import { questionRoutes } from './question.routes.js';
import { examRoutes } from './exam.routes.js';
import { assignmentRoutes } from './assignment.routes.js';
import { progressRoutes } from './progress.routes.js';
import { libraryRoutes } from './library.routes.js';
import { teacherRoutes } from './teacher.routes.js';
import { parentRoutes } from './parent.routes.js';
import { schoolRoutes } from '../schools/routes/school.routes.js';
import { subscriptionRoutes } from './subscription.routes.js';
import { paymentRoutes } from './payment.routes.js';
import { notificationRoutes } from './notification.routes.js';
import { aiRoutes } from './ai.routes.js';
import { gamificationRoutes } from './gamification.routes.js';
import { communityRoutes } from './community.routes.js';
import { searchRoutes } from './search.routes.js';
import { analyticsRoutes } from './analytics.routes.js';
import { reportRoutes } from './report.routes.js';
import { adminRoutes } from './admin.routes.js';
import { storageRoutes } from './storage.routes.js';
import { certificateRoutes } from './certificate.routes.js';
import { liveClassRoutes } from './live-classes.routes.js';
import { pastQuestionRoutes } from './past-questions.routes.js';
import { documentRoutes } from './document.routes.js';
import { marketplaceRoutes } from './marketplace.routes.js';
import { corporateTrainingRoutes } from './corporate-training.routes.js';
import { affiliateRoutes } from './affiliate.routes.js';
import { advertisingRoutes } from './advertising.routes.js';
import { bookmarkRoutes } from './bookmark.routes.js';
import { administrationRoutes } from './administration.routes.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/education', educationRoutes);
apiRoutes.use('/curriculum', curriculumRoutes);
apiRoutes.use('/courses', courseRoutes);
apiRoutes.use('/lessons', lessonRoutes);
apiRoutes.use('/flashcards', flashcardRoutes);
apiRoutes.use('/assessments', assessmentRoutes);
apiRoutes.use('/questions', questionRoutes);
apiRoutes.use('/exams', examRoutes);
apiRoutes.use('/assignments', assignmentRoutes);
apiRoutes.use('/progress', progressRoutes);
apiRoutes.use('/library', libraryRoutes);
apiRoutes.use('/teachers', teacherRoutes);
apiRoutes.use('/parents', parentRoutes);
apiRoutes.use('/schools', schoolRoutes);
apiRoutes.use('/subscriptions', subscriptionRoutes);
apiRoutes.use('/payments', paymentRoutes);
apiRoutes.use('/notifications', notificationRoutes);
apiRoutes.use('/ai', aiRoutes);
apiRoutes.use('/gamification', gamificationRoutes);
apiRoutes.use('/community', communityRoutes);
apiRoutes.use('/search', searchRoutes);
apiRoutes.use('/analytics', analyticsRoutes);
apiRoutes.use('/reports', reportRoutes);
apiRoutes.use('/admin', adminRoutes);
apiRoutes.use('/storage', storageRoutes);
apiRoutes.use('/certificates', certificateRoutes);
apiRoutes.use('/live-classes', liveClassRoutes);
apiRoutes.use('/past-questions', pastQuestionRoutes);
apiRoutes.use('/documents', documentRoutes);
apiRoutes.use('/marketplace', marketplaceRoutes);
apiRoutes.use('/corporate-training', corporateTrainingRoutes);
apiRoutes.use('/affiliate', affiliateRoutes);
apiRoutes.use('/advertising', advertisingRoutes);
apiRoutes.use('/bookmarks', bookmarkRoutes);
apiRoutes.use('/administration', administrationRoutes);

apiRoutes.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Educational Platform API v1',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      education: '/api/v1/education',
      curriculum: '/api/v1/curriculum',
      courses: '/api/v1/courses',
      lessons: '/api/v1/lessons',
      flashcards: '/api/v1/flashcards',
      assessments: '/api/v1/assessments',
      questions: '/api/v1/questions',
      exams: '/api/v1/exams',
      assignments: '/api/v1/assignments',
      progress: '/api/v1/progress',
      library: '/api/v1/library',
      teachers: '/api/v1/teachers',
      parents: '/api/v1/parents',
      schools: '/api/v1/schools',
      subscriptions: '/api/v1/subscriptions',
      payments: '/api/v1/payments',
      notifications: '/api/v1/notifications',
      ai: '/api/v1/ai',
      gamification: '/api/v1/gamification',
      community: '/api/v1/community',
      search: '/api/v1/search',
      analytics: '/api/v1/analytics',
      reports: '/api/v1/reports',
      admin: '/api/v1/admin',
      storage: '/api/v1/storage',
      liveClasses: '/api/v1/live-classes',
      pastQuestions: '/api/v1/past-questions',
      documents: '/api/v1/documents',
      marketplace: '/api/v1/marketplace',
      corporateTraining: '/api/v1/corporate-training',
      affiliate: '/api/v1/affiliate',
      advertising: '/api/v1/advertising',
      bookmarks: '/api/v1/bookmarks',
      administration: '/api/v1/administration',
    },
  });
});