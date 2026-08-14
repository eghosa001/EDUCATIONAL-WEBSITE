import { query } from '../../common/database/index.js';
import schoolModel from '../models/school.model.js';

export const schoolService = {
  async list(params) {
    return schoolModel.list(params);
  },

  async getById(id) {
    return schoolModel.findById(id);
  },

  async create(data) {
    return schoolModel.create(data);
  },

  async update(id, data) {
    return schoolModel.update(id, data);
  },

  async delete(id) {
    return schoolModel.delete(id);
  },

  async getSchoolStats(schoolId) {
    const result = await query(
      `SELECT
        (SELECT COUNT(*)::int FROM school_students WHERE school_id = $1) as total_students,
        (SELECT COUNT(*)::int FROM school_teachers WHERE school_id = $1) as total_teachers,
        (SELECT COUNT(*)::int FROM classes c JOIN school_classes sc ON c.id = sc.class_id WHERE sc.school_id = $1) as total_classes
       FROM schools WHERE id = $1`,
      [schoolId]
    );
    return result.rows[0];
  },

  async addStudent(schoolId, studentId, classId) {
    return schoolModel.addStudent(schoolId, studentId, classId);
  },

  async removeStudent(schoolId, studentId) {
    return schoolModel.removeStudent(schoolId, studentId);
  },
};

export default schoolService;
