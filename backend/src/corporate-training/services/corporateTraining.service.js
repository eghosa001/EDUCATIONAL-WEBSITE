import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { corporateTrainingModel } from '../models/corporateTraining.model.js';
import { organizationModel } from '../models/organization.model.js';

export const corporateTrainingService = {
  // Organizations
  async listOrganizations(params) {
    return await organizationModel.list(params);
  },

  async getOrganization(id) {
    const org = await organizationModel.findById(id);
    if (!org) throw new AppError('Organization not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return org;
  },

  async createOrganization(data) {
    return await organizationModel.create(data);
  },

  async updateOrganization(id, data) {
    const org = await organizationModel.findById(id);
    if (!org) throw new AppError('Organization not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await organizationModel.update(id, data);
  },

  async deleteOrganization(id) {
    const org = await organizationModel.findById(id);
    if (!org) throw new AppError('Organization not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await organizationModel.delete(id);
  },

  async getOrganizationStats(id) {
    return await organizationModel.getOrganizationStats(id);
  },

  // Corporate Trainings
  async listTrainings(params) {
    return await corporateTrainingModel.list(params);
  },

  async getTraining(id) {
    const training = await corporateTrainingModel.findById(id);
    if (!training) throw new AppError('Training not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return training;
  },

  async createTraining(data) {
    return await corporateTrainingModel.create(data);
  },

  async updateTraining(id, data) {
    const training = await corporateTrainingModel.findById(id);
    if (!training) throw new AppError('Training not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await corporateTrainingModel.update(id, data);
  },

  async deleteTraining(id) {
    const training = await corporateTrainingModel.findById(id);
    if (!training) throw new AppError('Training not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await corporateTrainingModel.delete(id);
  },

  // Enrollment
  async enrollUser(trainingId, userId, enrolledBy) {
    return await corporateTrainingModel.enrollUser(trainingId, userId, enrolledBy);
  },

  async bulkEnrollUsers(data) {
    return await corporateTrainingModel.bulkEnroll(data);
  },

  async listEnrollments(params) {
    return await corporateTrainingModel.listEnrollments(params);
  },

  async getTrainingStats(trainingId) {
    return await corporateTrainingModel.getTrainingStats(trainingId);
  },

  async withdrawEnrollment(enrollmentId, userId) {
    const result = await query(
      "UPDATE corporate_training_enrollments SET status = 'withdrawn' WHERE id = $1 AND user_id = $2 AND status = 'active' RETURNING *",
      [enrollmentId, userId]
    );
    if (!result.rows[0]) throw new AppError('Enrollment not found or already withdrawn', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return result.rows[0];
  },
};
