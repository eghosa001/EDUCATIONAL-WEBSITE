import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { corporateTrainingService } from '../services/corporateTraining.service.js';

export async function listOrganizations(req, res) {
  const result = await corporateTrainingService.listOrganizations(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getOrganization(req, res) {
  const org = await corporateTrainingService.getOrganization(req.params.id);
  res.json({ success: true, data: org });
}

export async function createOrganization(req, res) {
  const org = await corporateTrainingService.createOrganization(req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: org });
}

export async function updateOrganization(req, res) {
  const org = await corporateTrainingService.updateOrganization(req.params.id, req.body);
  res.json({ success: true, data: org });
}

export async function deleteOrganization(req, res) {
  await corporateTrainingService.deleteOrganization(req.params.id);
  res.json({ success: true, message: 'Organization deleted' });
}

export async function getOrganizationStats(req, res) {
  const stats = await corporateTrainingService.getOrganizationStats(req.params.id);
  res.json({ success: true, data: stats });
}

export async function listTrainings(req, res) {
  const result = await corporateTrainingService.listTrainings(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getTraining(req, res) {
  const training = await corporateTrainingService.getTraining(req.params.id);
  res.json({ success: true, data: training });
}

export async function createTraining(req, res) {
  const training = await corporateTrainingService.createTraining({
    ...req.body,
    createdBy: req.user.id,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: training });
}

export async function updateTraining(req, res) {
  const training = await corporateTrainingService.updateTraining(req.params.id, req.body);
  res.json({ success: true, data: training });
}

export async function deleteTraining(req, res) {
  await corporateTrainingService.deleteTraining(req.params.id);
  res.json({ success: true, message: 'Training deleted' });
}

export async function getTrainingStats(req, res) {
  const stats = await corporateTrainingService.getTrainingStats(req.params.id);
  res.json({ success: true, data: stats });
}

export async function enrollUser(req, res) {
  const enrollment = await corporateTrainingService.enrollUser(
    req.params.id,
    req.user.id,
    req.user.id
  );
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: enrollment });
}

export async function bulkEnrollUsers(req, res) {
  const results = await corporateTrainingService.bulkEnrollUsers({
    trainingId: req.params.id,
    userIds: req.body.userIds,
    enrolledBy: req.user.id,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: results, count: results.length });
}

export async function listEnrollments(req, res) {
  const result = await corporateTrainingService.listEnrollments({
    ...req.query,
    trainingId: req.params.id,
  });
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function withdrawEnrollment(req, res) {
  const enrollment = await corporateTrainingService.withdrawEnrollment(req.params.id, req.user.id);
  res.json({ success: true, data: enrollment });
}
