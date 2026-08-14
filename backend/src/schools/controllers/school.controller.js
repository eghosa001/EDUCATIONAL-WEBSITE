import { schoolService } from '../services/school.service.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

export const listSchools = async (req, res) => {
  const params = {
    page: req.query.page ? parseInt(req.query.page) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    search: req.query.search,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
  };
  const result = await schoolService.list(params);
  res.json({ success: true, data: result });
};

export const getSchoolById = async (req, res) => {
  const school = await schoolService.getById(req.params.id);
  res.json({ success: true, data: school });
};

export const createSchool = async (req, res) => {
  const school = await schoolService.create(req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: school, message: 'School created successfully' });
};

export const updateSchool = async (req, res) => {
  const school = await schoolService.update(req.params.id, req.body);
  res.json({ success: true, data: school, message: 'School updated successfully' });
};

export const deleteSchool = async (req, res) => {
  await schoolService.delete(req.params.id);
  res.json({ success: true, message: 'School deleted successfully' });
};

export const getSchoolStats = async (req, res) => {
  const stats = await schoolService.getSchoolStats(req.params.id);
  res.json({ success: true, data: stats });
};

export const addStudent = async (req, res) => {
  const result = await schoolService.addStudent(req.params.id, req.body.studentId, req.body.classId);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: result, message: 'Student added to school' });
};

export const removeStudent = async (req, res) => {
  await schoolService.removeStudent(req.params.id, req.params.studentId);
  res.json({ success: true, message: 'Student removed from school' });
};
