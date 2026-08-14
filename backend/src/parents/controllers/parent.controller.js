import { HTTP_STATUS } from '../../common/errors/index.js';
import { parentService } from '../services/parent.service.js';

export const getMyProfile = async (req, res) => {
  const parent = await parentService.getProfile(req.user.id);
  res.json({ success: true, data: { parent } });
};

export const updateMyProfile = async (req, res) => {
  const parent = await parentService.updateProfile(req.user.id, req.body);
  res.json({ success: true, message: 'Parent profile updated', data: { parent } });
};

export const listChildren = async (req, res) => {
  const children = await parentService.getChildren(req.user.id);
  res.json({ success: true, data: { children } });
};

export const addChild = async (req, res) => {
  const { userId } = req.body;
  const { link, child } = await parentService.addChild(req.user.id, userId);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Child linked successfully',
    data: { link, child },
  });
};

export const removeChild = async (req, res) => {
  await parentService.removeChild(req.user.id, req.params.childUserId);
  res.json({ success: true, message: 'Child unlinked successfully' });
};

export const getChildPerformance = async (req, res) => {
  const performance = await parentService.getChildPerformance(req.user.id, req.params.childUserId);
  res.json({ success: true, data: { performance } });
};

export const listChildCourses = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await parentService.getChildCourses(req.user.id, req.params.childUserId, { page, limit });
  res.json({ success: true, data: { courses: data }, pagination });
};

export const listChildExams = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await parentService.getChildExams(req.user.id, req.params.childUserId, { page, limit });
  res.json({ success: true, data: { exams: data }, pagination });
};

export const getChildProgress = async (req, res) => {
  const progress = await parentService.getChildProgress(req.user.id, req.params.childUserId);
  res.json({ success: true, data: { progress } });
};

export const getChildStudyTime = async (req, res) => {
  const { startDate, endDate } = req.query;
  const studyTime = await parentService.getChildStudyTime(req.user.id, req.params.childUserId, { startDate, endDate });
  res.json({ success: true, data: { studyTime } });
};

export const listNotifications = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await parentService.listNotifications(req.user.id, { page, limit });
  res.json({ success: true, data: { notifications: data }, pagination });
};

export const markNotificationRead = async (req, res) => {
  const notification = await parentService.markNotificationRead(req.user.id, req.params.notificationId);
  res.json({ success: true, message: 'Notification marked as read', data: { notification } });
};

export const listReports = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await parentService.listReports(req.user.id, { page, limit });
  res.json({ success: true, data: { reports: data }, pagination });
};

export const generateReport = async (req, res) => {
  const report = await parentService.generateReport(req.user.id, req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Report generated',
    data: { report },
  });
};

export const listMyChildren = listChildren;
export const getChildCourses = listChildCourses;
export const getChildExams = listChildExams;
