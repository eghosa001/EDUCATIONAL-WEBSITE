import { lessonProgressModel } from '../models/lessonProgress.model.js';
import { studySessionModel } from '../models/studySession.model.js';
import { studentCourseModel } from '../models/studentCourse.model.js';
import { lessonModel } from '../../lessons/models/lesson.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const getMyOverview = async (req, res) => {
  const [courses, totalStudySeconds] = await Promise.all([
    studentCourseModel.listByStudent(req.user.id),
    studySessionModel.totalStudyTime(req.user.id, null, null),
  ]);

  const lessonProgress = await query(
    `SELECT COUNT(*)::int AS completed
     FROM lesson_progress WHERE student_id = $1 AND status = 'completed'`,
    [req.user.id]
  );

  const examStats = await query(
    `SELECT COUNT(DISTINCT exam_id)::int AS exams_taken,
            AVG(percentage)::numeric(5,2) AS avg_score
     FROM exam_attempts
     WHERE student_id = $1 AND status = 'submitted'`,
    [req.user.id]
  );

  const avgCourseProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / courses.length)
    : 0;

  res.json({
    success: true,
    data: {
      overview: {
        enrolledCourses: courses.length,
        completedLessons: lessonProgress.rows[0].completed,
        totalStudyTimeSeconds: totalStudySeconds,
        averageCourseProgress: avgCourseProgress,
        examsTaken: examStats.rows[0].exams_taken || 0,
        averageExamScore: parseFloat(examStats.rows[0].avg_score) || 0,
      },
    },
  });
};

export const getCourseProgress = async (req, res) => {
  const { courseId } = req.params;

  const enrollment = await studentCourseModel.findByStudentAndCourse(req.user.id, courseId);
  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const [progressRows, totalLessons, completedCount] = await Promise.all([
    lessonProgressModel.listByStudentAndCourse(req.user.id, courseId),
    query('SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1 AND is_published = TRUE', [courseId]),
    lessonProgressModel.countCompletedByCourse(req.user.id, courseId),
  ]);

  res.json({
    success: true,
    data: {
      progress: {
        courseId,
        progressPercentage: enrollment.progress_percentage,
        completedLessons: completedCount,
        totalLessons: totalLessons.rows[0].total,
        lastAccessedAt: enrollment.last_accessed_at,
        completedAt: enrollment.completed_at,
        lessons: progressRows,
      },
    },
  });
};

export const updateLessonProgress = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { status, progressPercentage, watchTimeSeconds, lastPositionSeconds } = req.body;

  const course = await courseModel.findById(courseId);
  if (!course) notFound('Course');

  const lesson = await lessonModel.findById(lessonId);
  if (!lesson) notFound('Lesson');

  const enrollment = await studentCourseModel.findByStudentAndCourse(req.user.id, courseId);
  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const progress = await lessonProgressModel.upsert({
    studentId: req.user.id,
    lessonId,
    courseId,
    status,
    progressPercentage,
    watchTimeSeconds,
    lastPositionSeconds,
  });

  res.json({
    success: true,
    message: 'Progress updated',
    data: { progress },
  });
};

export const completeLesson = async (req, res) => {
  const { courseId, lessonId } = req.params;

  const progress = await lessonProgressModel.markComplete(req.user.id, lessonId, courseId);
  if (!progress) notFound('Lesson');

  const [completedCount, totalLessons] = await Promise.all([
    lessonProgressModel.countCompletedByCourse(req.user.id, courseId),
    query('SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1 AND is_published = TRUE', [courseId]),
  ]);

  const percentage = totalLessons.rows[0].total > 0
    ? Math.round((completedCount / totalLessons.rows[0].total) * 100)
    : 0;

  const enrollment = await studentCourseModel.updateProgress(req.user.id, courseId, percentage);

  res.json({
    success: true,
    message: 'Lesson completed',
    data: {
      progress,
      courseProgress: {
        courseId,
        completedLessons: completedCount,
        totalLessons: totalLessons.rows[0].total,
        progressPercentage: percentage,
        courseCompleted: percentage >= 100,
        completedAt: enrollment?.completed_at || null,
      },
    },
  });
};

export const startStudySession = async (req, res) => {
  const { courseId, lessonId, activityType, metadata } = req.body;

  const session = await studySessionModel.create({
    studentId: req.user.id,
    courseId,
    lessonId,
    activityType,
    metadata,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Study session started',
    data: { session },
  });
};

export const endStudySession = async (req, res) => {
  const session = await studySessionModel.end(req.params.id);
  if (!session) notFound('Study session');

  res.json({
    success: true,
    message: 'Study session ended',
    data: { session },
  });
};

export const listStudySessions = async (req, res) => {
  const { page, limit } = req.query;

  const { data, pagination } = await studySessionModel.listByStudent(req.user.id, { page, limit });

  res.json({ success: true, data: { sessions: data }, pagination });
};
