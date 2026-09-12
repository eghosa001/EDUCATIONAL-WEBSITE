import { lessonModel } from '../models/lesson.model.js';
import { lessonResourceModel } from '../models/lessonResource.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import progressService from '../../progress/services/progress.service.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { slugify, isUuid } from '../../common/utils/index.js';
import { assessLessonContent } from '../content-quality.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const roleSet = (user) => new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
const isGlobalContentManager = (user) => {
  const roles = roleSet(user);
  return roles.has('super_admin') || roles.has('content_admin');
};
const canManageCourse = (user, course) => isGlobalContentManager(user) || (roleSet(user).has('teacher') && course?.teacher_id === user?.id);
const loadCourseForLesson = async (lesson) => lesson?.course_id ? courseModel.findById(lesson.course_id) : null;
const requireLessonManager = async (req, lesson) => {
  const course = await loadCourseForLesson(lesson);
  if (!course || !canManageCourse(req.user, course)) {
    throw new AppError('Not authorized to manage this lesson', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  return course;
};

const assertLessonPublishable = (lesson) => {
  const assessment = assessLessonContent(lesson);
  if (!assessment.valid) {
    throw new AppError(
      `Lesson cannot be published: ${assessment.issues.join(' ')}`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY || 422,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
};

export const listLessons = async (req, res) => {
  const { page, limit, courseId, sectionId, topicId, isPublished } = req.query;
  let publishedFilter = true;

  if (isGlobalContentManager(req.user)) {
    publishedFilter = isPublished === undefined ? undefined : isPublished === 'true';
  } else if (roleSet(req.user).has('teacher') && courseId && isPublished === 'false') {
    const course = await courseModel.findById(courseId);
    publishedFilter = course && canManageCourse(req.user, course) ? false : true;
  }

  const { data, pagination } = await lessonModel.list({
    page, limit, courseId, sectionId, topicId,
    isPublished: publishedFilter,
  });

  res.json({ success: true, data: { lessons: data }, pagination });
};

export const getLesson = async (req, res) => {
  const { slugOrId } = req.params;
  let lesson = isUuid(slugOrId) ? await lessonModel.findById(slugOrId) : null;

  if (!lesson) {
    const courseId = req.query.courseId;
    if (!courseId) notFound('Lesson');
    lesson = await lessonModel.findBySlug(courseId, slugOrId);
    if (!lesson) notFound('Lesson');
  }

  const course = await loadCourseForLesson(lesson);
  const manager = course ? canManageCourse(req.user, course) : false;
  if ((!lesson.is_published || lesson.content_quality === 'needs_review') && !manager) notFound('Lesson');

  await lessonModel.incrementViews(lesson.id);
  const resources = await lessonResourceModel.listByLesson(lesson.id);

  res.json({ success: true, data: { lesson: { ...lesson, resources } } });
};

export const createLesson = async (req, res) => {
  const course = await courseModel.findById(req.body.courseId);
  if (!course) notFound('Course');
  if (!canManageCourse(req.user, course)) {
    throw new AppError('Not authorized to add lessons to this course', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  let slug = slugify(req.body.title);
  if (await lessonModel.findBySlug(course.id, slug)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const lesson = await lessonModel.create({ ...req.body, slug, isPublished: false });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Lesson created',
    data: { lesson },
  });
};

export const updateLesson = async (req, res) => {
  const existing = await lessonModel.findById(req.params.id);
  if (!existing) notFound('Lesson');
  await requireLessonManager(req, existing);

  if (req.body.isPublished === true || req.body.is_published === true) {
    assertLessonPublishable({ ...existing, ...req.body });
  }

  const lesson = await lessonModel.update(req.params.id, req.body);
  if (!lesson) notFound('Lesson');

  res.json({ success: true, message: 'Lesson updated', data: { lesson } });
};

export const publishLesson = async (req, res) => {
  const existing = await lessonModel.findById(req.params.id);
  if (!existing) notFound('Lesson');
  await requireLessonManager(req, existing);
  assertLessonPublishable(existing);

  const lesson = await lessonModel.update(req.params.id, { isPublished: true });
  if (!lesson) notFound('Lesson');

  res.json({ success: true, message: 'Lesson published', data: { lesson } });
};

export const deleteLesson = async (req, res) => {
  const existing = await lessonModel.findById(req.params.id);
  if (!existing) notFound('Lesson');
  await requireLessonManager(req, existing);

  const lesson = await lessonModel.delete(req.params.id);
  if (!lesson) notFound('Lesson');

  res.json({ success: true, message: 'Lesson deleted' });
};

export const listResources = async (req, res) => {
  const lesson = await lessonModel.findById(req.params.id);
  if (!lesson) notFound('Lesson');
  const course = await loadCourseForLesson(lesson);
  const manager = course ? canManageCourse(req.user, course) : false;
  if ((!lesson.is_published || lesson.content_quality === 'needs_review') && !manager) notFound('Lesson');

  const resources = await lessonResourceModel.listByLesson(lesson.id);
  res.json({ success: true, data: { resources } });
};

export const createResource = async (req, res) => {
  const lesson = await lessonModel.findById(req.params.id);
  if (!lesson) notFound('Lesson');
  await requireLessonManager(req, lesson);

  const resource = await lessonResourceModel.create({ ...req.body, lessonId: lesson.id });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Resource added',
    data: { resource },
  });
};

export const deleteResource = async (req, res) => {
  const lesson = await lessonModel.findById(req.params.id);
  if (!lesson) notFound('Lesson');
  await requireLessonManager(req, lesson);

  const existing = await lessonResourceModel.findById(req.params.resourceId);
  if (!existing || existing.lesson_id !== req.params.id) notFound('Resource');

  const resource = await lessonResourceModel.delete(req.params.resourceId);
  if (!resource) notFound('Resource');

  res.json({ success: true, message: 'Resource deleted' });
};

export const completeLesson = async (req, res) => {
  const { id } = req.params;

  const lesson = await lessonModel.findById(id);
  if (!lesson || !lesson.is_published || lesson.content_quality === 'needs_review') notFound('Lesson');
  if (!lesson.course_id) {
    throw new AppError('Lesson is not attached to an enrollable course', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const enrollment = await studentCourseModel.findByStudentAndCourse(req.user.id, lesson.course_id);
  if (!enrollment) {
    throw new AppError('Enroll in the course before completing lessons', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const result = await progressService.completeLesson(req.user.id, lesson.id, lesson.course_id);
  await lessonModel.incrementCompletions(lesson.id);

  res.json({ success: true, message: 'Lesson marked as complete', data: result });
};
