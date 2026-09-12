import { liveClassModel } from './models/liveClass.model.js';
import { query } from '../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../common/errors/index.js';
import { slugify } from '../common/utils/index.js';

const ADMIN_ROLES = new Set(['content_admin', 'super_admin']);
const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};
const isAdmin = (req) => ADMIN_ROLES.has(req.user?.role) || (req.user?.roles || []).some((role) => ADMIN_ROLES.has(role));
const canManageClass = (req, class_) => isAdmin(req) || class_?.teacher_id === req.user?.id;
const assertClassManager = (req, class_) => {
  if (!canManageClass(req, class_)) {
    throw new AppError('Not authorized to manage this live class', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
};
const withoutMeetingUrl = (class_) => {
  if (!class_) return class_;
  const { meeting_url, ...safe } = class_;
  return safe;
};

export const listClasses = async (req, res) => {
  const { page, limit, status, subjectId, teacherId, search } = req.query;
  const { data, pagination } = await liveClassModel.list({ page, limit, status, subjectId, teacherId, search });
  res.json({ success: true, data: { classes: data.map(withoutMeetingUrl) }, pagination });
};

export const getClass = async (req, res) => {
  const { id } = req.params;
  const class_ = await liveClassModel.findById(id);
  if (!class_) notFound('Live class');

  const attendance = req.user ? await liveClassModel.getAttendance(id, req.user.id) : null;
  const canSeeMeetingUrl = Boolean(req.user && (canManageClass(req, class_) || attendance));
  res.json({
    success: true,
    data: { class: { ...(canSeeMeetingUrl ? class_ : withoutMeetingUrl(class_)), myAttendance: attendance } },
  });
};

export const createClass = async (req, res) => {
  const {
    title, description, subjectId, topicId, scheduledAt,
    durationMinutes, maxParticipants, meetingUrl,
  } = req.body;

  let slug = slugify(title);
  if (await liveClassModel.findBySlug(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const class_ = await liveClassModel.create({
    title, description, subjectId, topicId,
    teacherId: req.user.id, scheduledAt, durationMinutes,
    maxParticipants, meetingUrl, slug,
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Live class created', data: { class: class_ } });
};

export const updateClass = async (req, res) => {
  const existing = await liveClassModel.findById(req.params.id);
  if (!existing) notFound('Live class');
  assertClassManager(req, existing);
  const class_ = await liveClassModel.update(req.params.id, req.body);
  res.json({ success: true, message: 'Live class updated', data: { class: class_ } });
};

export const deleteClass = async (req, res) => {
  const existing = await liveClassModel.findById(req.params.id);
  if (!existing) notFound('Live class');
  assertClassManager(req, existing);
  const class_ = await liveClassModel.delete(req.params.id);
  if (!class_) notFound('Live class');
  res.json({ success: true, message: 'Live class deleted' });
};

export const getMyClasses = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await liveClassModel.listByTeacher(req.user.id, { page, limit });
  res.json({ success: true, data: { classes: data }, pagination });
};

export const joinClass = async (req, res) => {
  const { id } = req.params;
  const class_ = await liveClassModel.findById(id);
  if (!class_) notFound('Live class');
  if (class_.status !== 'live' && class_.status !== 'scheduled') {
    throw new AppError('Class is not available', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const existing = await liveClassModel.getAttendance(id, req.user.id);
  if (!existing && class_.max_participants) {
    const active = await liveClassModel.countActiveParticipants(id);
    if (active >= Number(class_.max_participants)) {
      throw new AppError('Class is full', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    }
  }

  const attendance = await liveClassModel.upsertAttendance(id, req.user.id, 'joined');
  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Joined class', data: { attendance, meetingUrl: class_.meeting_url } });
};

export const leaveClass = async (req, res) => {
  const class_ = await liveClassModel.findById(req.params.id);
  if (!class_) notFound('Live class');
  const attendance = await liveClassModel.leaveClass(req.params.id, req.user.id);
  if (!attendance) notFound('Attendance record');
  res.json({ success: true, message: 'Left class' });
};

export const endClass = async (req, res) => {
  const existing = await liveClassModel.findById(req.params.id);
  if (!existing) notFound('Live class');
  assertClassManager(req, existing);
  const class_ = await liveClassModel.update(req.params.id, { status: 'ended' });
  res.json({ success: true, message: 'Class ended', data: { class: class_ } });
};

export const getClassParticipants = async (req, res) => {
  const class_ = await liveClassModel.findById(req.params.id);
  if (!class_) notFound('Live class');
  assertClassManager(req, class_);
  const participants = await liveClassModel.listAttendance(req.params.id);
  res.json({ success: true, data: { participants } });
};

export const markAttendance = async (req, res) => {
  const { status } = req.body;
  const class_ = await liveClassModel.findById(req.params.id);
  if (!class_) notFound('Live class');
  const attendance = await liveClassModel.markAttendance(req.params.id, req.user.id, status);
  if (!attendance) notFound('Attendance record');
  res.json({ success: true, message: 'Attendance marked', data: { attendance } });
};

export const getClassAnalytics = async (req, res) => {
  const class_ = await liveClassModel.findById(req.params.id);
  if (!class_) notFound('Live class');
  assertClassManager(req, class_);
  const analytics = await liveClassModel.getAnalytics(req.params.id);
  res.json({ success: true, data: { analytics } });
};

export const getUpcomingClasses = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT lc.id, lc.title, lc.description, lc.subject_id, lc.topic_id, lc.teacher_id,
            lc.scheduled_at, lc.duration_minutes, lc.max_participants, lc.status, lc.slug,
            u.first_name as teacher_name, u.last_name,
            la.status as attendance_status, la.joined_at
     FROM live_classes lc
     JOIN users u ON lc.teacher_id = u.id
     LEFT JOIN live_class_attendance la ON lc.id = la.class_id AND la.user_id = $1
     WHERE lc.status = 'scheduled' AND lc.scheduled_at > NOW()
     ORDER BY lc.scheduled_at ASC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM live_classes
     WHERE status = 'scheduled' AND scheduled_at > NOW()`
  );
  const total = Number(countResult.rows[0]?.total || 0);

  res.json({
    success: true,
    data: { classes: result.rows },
    pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
  });
};
