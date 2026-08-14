import { query } from '../../common/database/index.js';
import lessonProgressModel from '../models/lessonProgress.model.js';
import studySessionModel from '../models/studySession.model.js';
import studentCourseModel from '../models/studentCourse.model.js';

export const progressService = {
  async getOverview(userId) {
    const [coursesResult, totalStudyResult, lessonProgressResult, examStatsResult] = await Promise.all([
      studentCourseModel.listByStudent(userId),
      studySessionModel.totalStudyTime(userId, null, null),
      query(
        `SELECT COUNT(*)::int AS completed FROM lesson_progress WHERE student_id = $1 AND status = 'completed'`,
        [userId]
      ),
      query(
        `SELECT COUNT(DISTINCT exam_id)::int AS exams_taken, AVG(percentage)::numeric(5,2) AS avg_score
         FROM exam_attempts WHERE student_id = $1 AND status = 'submitted'`,
        [userId]
      ),
    ]);

    const courses = coursesResult;
    const avgCourseProgress = courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / courses.length)
      : 0;

    return {
      enrolledCourses: courses.length,
      completedLessons: parseInt(lessonProgressResult.rows[0]?.completed || 0),
      totalStudyTimeSeconds: parseInt(totalStudyResult?.rows[0]?.total || 0),
      averageCourseProgress: avgCourseProgress,
      examsTaken: parseInt(examStatsResult.rows[0]?.exams_taken || 0),
      averageExamScore: parseFloat(examStatsResult.rows[0]?.avg_score || 0),
    };
  },

  async getCourseProgress(userId, courseId) {
    const enrollment = await studentCourseModel.findByStudentAndCourse(userId, courseId);
    if (!enrollment) throw new Error('Not enrolled in this course');

    const [progressRows, totalLessons, completedCount] = await Promise.all([
      lessonProgressModel.listByStudentAndCourse(userId, courseId),
      query('SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1 AND is_published = TRUE', [courseId]),
      lessonProgressModel.countCompletedByCourse(userId, courseId),
    ]);

    return {
      courseId,
      progressPercentage: enrollment.progress_percentage,
      completedLessons: completedCount,
      totalLessons: parseInt(totalLessons.rows[0]?.total || 0),
      lastAccessedAt: enrollment.last_accessed_at,
      completedAt: enrollment.completed_at,
      lessons: progressRows,
    };
  },

  async updateLessonProgress(userId, lessonId, courseId, data) {
    const enrollment = await studentCourseModel.findByStudentAndCourse(userId, courseId);
    if (!enrollment) throw new Error('Not enrolled in this course');

    const progress = await lessonProgressModel.upsert({
      studentId: userId, lessonId, courseId, ...data,
    });
    return progress;
  },

  async completeLesson(userId, lessonId, courseId) {
    const progress = await lessonProgressModel.markComplete(userId, lessonId, courseId);
    if (!progress) throw new Error('Lesson not found');

    const [completedCount, totalLessons] = await Promise.all([
      lessonProgressModel.countCompletedByCourse(userId, courseId),
      query('SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1 AND is_published = TRUE', [courseId]),
    ]);

    const total = parseInt(totalLessons.rows[0]?.total || 0);
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const enrollment = await studentCourseModel.updateProgress(userId, courseId, percentage);

    return {
      progress,
      courseProgress: {
        courseId,
        completedLessons: completedCount,
        totalLessons: total,
        progressPercentage: percentage,
        courseCompleted: percentage >= 100,
        completedAt: enrollment?.completed_at || null,
      },
    };
  },

  async startStudySession(userId, data) {
    return studySessionModel.create({ studentId: userId, ...data });
  },

  async endStudySession(sessionId) {
    return studySessionModel.end(sessionId);
  },

  async listStudySessions(userId, params) {
    return studySessionModel.listByStudent(userId, params);
  },

  async getWeakTopics(userId) {
    const result = await query(
      `SELECT q.subject_id, q.topic_id, s.name as subject_name, t.name as topic_name,
              COUNT(*) as total, SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END) as correct
       FROM exam_answers ea
       JOIN exam_attempts exa ON ea.attempt_id = exa.id
       JOIN questions q ON ea.question_id = q.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN topics t ON q.topic_id = t.id
       WHERE exa.student_id = $1 AND exa.status = 'submitted'
       GROUP BY q.subject_id, q.topic_id, s.name, t.name
       HAVING COUNT(*) >= 3
       ORDER BY (SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END)::float / COUNT(*)) ASC
       LIMIT 10`,
      [userId]
    );
    return result.rows.map(row => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      topicId: row.topic_id,
      topicName: row.topic_name,
      total: parseInt(row.total),
      correct: parseInt(row.correct),
      accuracy: row.total > 0 ? ((parseInt(row.correct) / parseInt(row.total)) * 100).toFixed(1) : 0,
    }));
  },

  async getPerformanceAnalytics(userId) {
    const result = await query(
      `SELECT s.name as subject_name,
              COUNT(DISTINCT ea.attempt_id) as attempts,
              AVG(ea.percentage) as avg_score,
              MAX(ea.percentage) as best_score,
              MIN(ea.percentage) as worst_score
       FROM exam_attempts ea
       JOIN subjects s ON ea.subject_id = s.id
       WHERE ea.student_id = $1 AND ea.status = 'submitted'
       GROUP BY s.name
       ORDER BY avg_score DESC`,
      [userId]
    );
    return result.rows.map(row => ({
      subject: row.subject_name,
      attempts: parseInt(row.attempts),
      avgScore: parseFloat(row.avg_score)?.toFixed(2) || 0,
      bestScore: parseFloat(row.best_score)?.toFixed(2) || 0,
      worstScore: parseFloat(row.worst_score)?.toFixed(2) || 0,
    }));
  },
};

export default progressService;
