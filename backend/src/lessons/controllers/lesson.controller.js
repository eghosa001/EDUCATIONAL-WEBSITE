import { lessonModel } from '../models/lesson.model.js';
import { lessonResourceModel } from '../models/lessonResource.model.js';
import { courseModel } from '../../courses/models/course.model.js';
import { studentCourseModel } from '../../progress/models/studentCourse.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { slugify, isUuid } from '../../common/utils/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listLessons = async (req, res) => {
  const { page, limit, courseId, sectionId, topicId, isPublished } = req.query;

  const { data, pagination } = await lessonModel.list({
    page, limit, courseId, sectionId, topicId,
    isPublished: isPublished === undefined ? undefined : isPublished === 'true',
  });

  res.json({ success: true, data: { lessons: data }, pagination });
};

export const getLesson = async (req, res) => {
  const { slugOrId } = req.params;
  const lesson = isUuid(slugOrId)
    ? await lessonModel.findById(slugOrId)
    : null;

  if (!lesson) {
    const courseId = req.query.courseId;
    if (!courseId) notFound('Lesson');
    const found = await lessonModel.findBySlug(courseId, slugOrId);
    if (!found) notFound('Lesson');
    return res.json({ success: true, data: { lesson: found } });
  }

  await lessonModel.incrementViews(lesson.id);
  const resources = await lessonResourceModel.listByLesson(lesson.id);

  res.json({ success: true, data: { lesson: { ...lesson, resources } } });
};

export const createLesson = async (req, res) => {
  const course = await courseModel.findById(req.body.courseId);
  if (!course) notFound('Course');

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
  const lesson = await lessonModel.update(req.params.id, req.body);
  if (!lesson) notFound('Lesson');

  res.json({ success: true, message: 'Lesson updated', data: { lesson } });
};

export const publishLesson = async (req, res) => {
  const lesson = await lessonModel.update(req.params.id, { isPublished: true });
  if (!lesson) notFound('Lesson');

  res.json({ success: true, message: 'Lesson published', data: { lesson } });
};

export const deleteLesson = async (req, res) => {
  const lesson = await lessonModel.delete(req.params.id);
  if (!lesson) notFound('Lesson');

  res.json({ success: true, message: 'Lesson deleted' });
};

export const listResources = async (req, res) => {
  const lesson = await lessonModel.findById(req.params.id);
  if (!lesson) notFound('Lesson');

  const resources = await lessonResourceModel.listByLesson(lesson.id);
  res.json({ success: true, data: { resources } });
};

export const createResource = async (req, res) => {
  const lesson = await lessonModel.findById(req.params.id);
  if (!lesson) notFound('Lesson');

  const resource = await lessonResourceModel.create({ ...req.body, lessonId: lesson.id });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Resource added',
    data: { resource },
  });
};

export const deleteResource = async (req, res) => {
  const resource = await lessonResourceModel.delete(req.params.resourceId);
  if (!resource) notFound('Resource');

  res.json({ success: true, message: 'Resource deleted' });
};

export const completeLesson = async (req, res) => {
  const { id } = req.params;

  const lesson = await lessonModel.findById(id);
  if (!lesson) notFound('Lesson');

  const enrollment = await studentCourseModel.findByStudentAndCourse(req.user.id, lesson.course_id);
  if (!enrollment) {
    throw new AppError('Enroll in the course before completing lessons', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  await lessonModel.incrementCompletions(lesson.id);

  res.json({ success: true, message: 'Lesson marked as complete' });
};
