import { HTTP_STATUS } from '../../common/errors/index.js';
import { teacherService } from '../services/teacher.service.js';

export const getMyProfile = async (req, res) => {
  const teacher = await teacherService.getProfile(req.user.id);
  res.json({ success: true, data: { teacher } });
};

export const updateMyProfile = async (req, res) => {
  const teacher = await teacherService.updateProfile(req.user.id, req.body);
  res.json({ success: true, message: 'Teacher profile updated', data: { teacher } });
};

export const listMyCourses = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listCourses(req.user.id, { page, limit });
  res.json({ success: true, data: { courses: data }, pagination });
};

export const getCourseStats = async (req, res) => {
  const stats = await teacherService.getCourseStats(req.user.id, req.params.courseId);
  res.json({ success: true, data: { stats } });
};

export const listMyStudents = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listStudents(req.user.id, { page, limit });
  res.json({ success: true, data: { students: data }, pagination });
};

export const getStudentProgress = async (req, res) => {
  const progress = await teacherService.getStudentProgress(req.user.id, req.params.studentUserId);
  res.json({ success: true, data: { progress } });
};

export const listMyExams = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listExams(req.user.id, { page, limit });
  res.json({ success: true, data: { exams: data }, pagination });
};

export const getExamStats = async (req, res) => {
  const stats = await teacherService.getExamStats(req.user.id, req.params.examId);
  res.json({ success: true, data: { stats } });
};

export const listMyAssignments = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listAssignments(req.user.id, { page, limit });
  res.json({ success: true, data: { assignments: data }, pagination });
};

export const listAssignmentSubmissions = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listAssignmentSubmissions(
    req.user.id,
    req.params.assignmentId,
    { page, limit }
  );
  res.json({ success: true, data: { submissions: data }, pagination });
};

export const listLiveClasses = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listLiveClasses(req.user.id, { page, limit });
  res.json({ success: true, data: { liveClasses: data }, pagination });
};

export const createLiveClass = async (req, res) => {
  const liveClass = await teacherService.createLiveClass(req.user.id, req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Live class scheduled',
    data: { liveClass },
  });
};

export const startLiveClass = async (req, res) => {
  const liveClass = await teacherService.startLiveClass(req.user.id, req.params.liveClassId);
  res.json({ success: true, message: 'Live class started', data: { liveClass } });
};

export const endLiveClass = async (req, res) => {
  const liveClass = await teacherService.endLiveClass(req.user.id, req.params.liveClassId);
  res.json({ success: true, message: 'Live class ended', data: { liveClass } });
};

export const listEarnings = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listEarnings(req.user.id, { page, limit });
  res.json({ success: true, data: { earnings: data }, pagination });
};

export const getEarningsSummary = async (req, res) => {
  const summary = await teacherService.getEarningsSummary(req.user.id);
  res.json({ success: true, data: { summary } });
};

export const getAnalytics = async (req, res) => {
  const analytics = await teacherService.getAnalytics(req.user.id);
  res.json({ success: true, data: { analytics } });
};

export const listNotifications = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await teacherService.listNotifications(req.user.id, { page, limit });
  res.json({ success: true, data: { notifications: data }, pagination });
};

export const markNotificationRead = async (req, res) => {
  const notification = await teacherService.markNotificationRead(req.user.id, req.params.notificationId);
  res.json({ success: true, message: 'Notification marked as read', data: { notification } });
};
