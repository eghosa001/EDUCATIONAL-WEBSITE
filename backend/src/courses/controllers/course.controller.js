import { courseModel } from '../models/course.model.js';
import { courseSectionModel } from '../models/courseSection.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import { lessonModel } from '../../lessons/models/lesson.model.js';
import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { COURSE_STATUS } from '../../common/constants/index.js';
import { slugify } from '../../common/utils/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const roleSet = (user) => new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
const isGlobalContentManager = (user) => {
  const roles = roleSet(user);
  return roles.has('super_admin') || roles.has('content_admin');
};
const canManageCourse = (user, course) => isGlobalContentManager(user) || (roleSet(user).has('teacher') && course?.teacher_id === user?.id);
const requireCourseManager = (req, course) => {
  if (!canManageCourse(req.user, course)) {
    throw new AppError('Not authorized to manage this course', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
};
const publicLessonsOnly = (lessons) => lessons.filter((lesson) => lesson.is_published && lesson.content_quality !== 'needs_review');

export const listCourses = async (req, res) => {
  const { page, limit, status, subjectId, classId, teacherId, search, featured } = req.query;
  const roles = roleSet(req.user);
  const isTeacher = roles.has('teacher');
  const globalManager = isGlobalContentManager(req.user);

  let effectiveStatus = status;
  let effectiveTeacherId = teacherId;
  if (!globalManager) {
    if (isTeacher && status && status !== COURSE_STATUS.PUBLISHED) {
      effectiveTeacherId = req.user.id;
    } else {
      effectiveStatus = COURSE_STATUS.PUBLISHED;
      effectiveTeacherId = teacherId;
    }
  }

  const { data, pagination } = await courseModel.list({
    page,
    limit,
    status: effectiveStatus,
    subjectId,
    classId,
    teacherId: effectiveTeacherId,
    search,
    featured: featured === 'true',
  });

  res.json({ success: true, data: { courses: data }, pagination });
};

export const getCourse = async (req, res) => {
  const { slugOrId } = req.params;
  const course = slugOrId.length === 36
    ? await courseModel.findById(slugOrId)
    : await courseModel.findBySlug(slugOrId);

  if (!course) notFound('Course');
  if (course.status !== COURSE_STATUS.PUBLISHED && !canManageCourse(req.user, course)) notFound('Course');

  const sections = await courseSectionModel.listByCourse(course.id);
  const allLessons = await lessonModel.listByCourse(course.id);
  const lessons = canManageCourse(req.user, course) ? allLessons : publicLessonsOnly(allLessons);

  const data = {
    ...course,
    sections,
    lessons: lessons.map(l => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      contentType: l.content_type,
      orderIndex: l.order_index,
      isFree: l.is_free,
      isPublished: l.is_published,
      estimatedMinutes: l.estimated_minutes,
    })),
  };

  res.json({ success: true, data: { course: data } });
};

export const createCourse = async (req, res) => {
  const { subjectId, classId, termId, title, shortDescription, fullDescription,
          thumbnailUrl, previewVideoUrl, difficulty, price, currency, isFree } = req.body;

  let slug = slugify(title);
  if (await courseModel.findBySlug(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const course = await courseModel.create({
    subjectId, classId, termId, teacherId: req.user.id, title, slug,
    shortDescription, fullDescription, thumbnailUrl, previewVideoUrl,
    difficulty, status: COURSE_STATUS.DRAFT, price, currency, isFree,
    isFeatured: false,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Course created',
    data: { course },
  });
};

export const updateCourse = async (req, res) => {
  const existing = await courseModel.findById(req.params.id);
  if (!existing) notFound('Course');
  requireCourseManager(req, existing);

  const course = await courseModel.update(req.params.id, req.body);
  if (!course) notFound('Course');

  res.json({ success: true, message: 'Course updated', data: { course } });
};

export const publishCourse = async (req, res) => {
  const existing = await courseModel.findById(req.params.id);
  if (!existing) notFound('Course');
  requireCourseManager(req, existing);

  const course = await courseModel.update(req.params.id, { status: COURSE_STATUS.PUBLISHED, publish: true });
  if (!course) notFound('Course');

  res.json({ success: true, message: 'Course published', data: { course } });
};

export const deleteCourse = async (req, res) => {
  const existing = await courseModel.findById(req.params.id);
  if (!existing) notFound('Course');
  requireCourseManager(req, existing);

  const course = await courseModel.delete(req.params.id);
  if (!course) notFound('Course');

  res.json({ success: true, message: 'Course deleted' });
};

export const listMyCourses = async (req, res) => {
  const courses = await studentCourseModel.listByStudent(req.user.id);

  res.json({ success: true, data: { courses } });
};

export const listFeaturedCourses = async (req, res) => {
  const { page, limit } = req.query;

  const { data, pagination } = await courseModel.list({
    page, limit, status: COURSE_STATUS.PUBLISHED, featured: true,
  });

  res.json({ success: true, data: { courses: data }, pagination });
};

export const enrollCourse = async (req, res) => {
  const { id } = req.params;

  const course = await courseModel.findById(id);
  if (!course) notFound('Course');

  if (course.status !== COURSE_STATUS.PUBLISHED) {
    throw new AppError('Course is not available for enrollment', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  let enrollment = await studentCourseModel.findByStudentAndCourse(req.user.id, course.id);
  if (!enrollment) {
    enrollment = await studentCourseModel.create({ studentId: req.user.id, courseId: course.id });
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Enrolled in course',
    data: { enrollment },
  });
};

export const unenrollCourse = async (req, res) => {
  const { id } = req.params;

  const enrollment = await studentCourseModel.delete(req.user.id, id);
  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, message: 'Unenrolled from course' });
};

export const listCourseStudents = async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) notFound('Course');
  requireCourseManager(req, course);

  const students = await studentCourseModel.listByCourse(req.params.id);

  res.json({ success: true, data: { students } });
};

export const createSection = async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) notFound('Course');
  requireCourseManager(req, course);

  const section = await courseSectionModel.create({ ...req.body, courseId: req.params.id });
  if (!section) notFound('Course');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Section created',
    data: { section },
  });
};

export const updateSection = async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) notFound('Course');
  requireCourseManager(req, course);

  const existing = await courseSectionModel.findById(req.params.sectionId);
  if (!existing || existing.course_id !== req.params.id) notFound('Section');

  const section = await courseSectionModel.update(req.params.sectionId, req.body);
  if (!section) notFound('Section');

  res.json({ success: true, message: 'Section updated', data: { section } });
};

export const deleteSection = async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) notFound('Course');
  requireCourseManager(req, course);

  const existing = await courseSectionModel.findById(req.params.sectionId);
  if (!existing || existing.course_id !== req.params.id) notFound('Section');

  const section = await courseSectionModel.delete(req.params.sectionId);
  if (!section) notFound('Section');

  res.json({ success: true, message: 'Section deleted' });
};

export const listCourseLessons = async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) notFound('Course');
  if (course.status !== COURSE_STATUS.PUBLISHED && !canManageCourse(req.user, course)) notFound('Course');

  const allLessons = await lessonModel.listByCourse(course.id);
  const lessons = canManageCourse(req.user, course) ? allLessons : publicLessonsOnly(allLessons);
  res.json({ success: true, data: { lessons } });
};

export const getCourseStats = async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) notFound('Course');
  requireCourseManager(req, course);

  const result = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM student_courses WHERE course_id = $1) AS enrollment_count,
       (SELECT COUNT(*)::int FROM lessons WHERE course_id = $1) AS lesson_count`,
    [req.params.id]
  );

  res.json({ success: true, data: { stats: result.rows[0] } });
};

export const listSavedCourses = async (req, res) => {
  const { page, limit } = req.query;
  const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
  const pLimit = parseInt(limit) || 20;

  const result = await query(
    `SELECT c.id, c.title, c.slug, c.thumbnail_url, c.short_description,
            c.difficulty, c.is_free, c.price, c.currency, c.rating, c.review_count,
            b.created_at as bookmarked_at
     FROM bookmarks b
     JOIN courses c ON b.course_id = c.id
     WHERE b.user_id = $1 AND c.status = $4
     ORDER BY b.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, pLimit, offset, COURSE_STATUS.PUBLISHED]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM bookmarks b
     JOIN courses c ON c.id = b.course_id
     WHERE b.user_id = $1 AND c.status = $2`,
    [req.user.id, COURSE_STATUS.PUBLISHED]
  );

  res.json({
    success: true,
    data: { courses: result.rows },
    pagination: {
      page: parseInt(page) || 1,
      limit: pLimit,
      total: parseInt(countResult.rows[0]?.total || 0),
      totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / pLimit),
    },
  });
};
