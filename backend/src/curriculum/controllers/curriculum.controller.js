import { subjectModel } from '../models/subject.model.js';
import { topicModel } from '../models/topic.model.js';
import { subtopicModel } from '../models/subtopic.model.js';
import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const listEducationSystems = async (req, res) => {
  const result = await query(
    'SELECT id, name, code, country, description, is_active FROM education_systems ORDER BY name'
  );
  res.json({ success: true, data: { educationSystems: result.rows } });
};

export const listEducationLevels = async (req, res) => {
  const result = await query(
    `SELECT id, education_system_id, name, code, description, order_index, min_age, max_age, is_active
     FROM education_levels ORDER BY order_index`
  );
  res.json({ success: true, data: { educationLevels: result.rows } });
};

export const listSubjects = async (req, res) => {
  const { page, limit, educationSystemId, classId, levelCode } = req.query;

  const { data, pagination } = await subjectModel.list({
    page, limit, educationSystemId, classId, levelCode,
  });

  res.json({ success: true, data: { subjects: data }, pagination });
};

export const getSubject = async (req, res) => {
  const subject = await subjectModel.findById(req.params.id);
  if (!subject) notFound('Subject');

  const topics = await topicModel.list({ subjectId: subject.id });
  const data = { ...subject, topics: topics.data };

  res.json({ success: true, data: { subject: data } });
};

export const createSubject = async (req, res) => {
  const { educationSystemId, name, code, description, icon, color, orderIndex, isCore } = req.body;

  const existing = await subjectModel.findByCode(educationSystemId, code);
  if (existing) {
    throw new AppError('Subject with this code already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  const subject = await subjectModel.create({
    educationSystemId, name, code: code.toLowerCase(), description, icon, color, orderIndex, isCore,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Subject created',
    data: { subject },
  });
};

export const updateSubject = async (req, res) => {
  const subject = await subjectModel.update(req.params.id, req.body);
  if (!subject) notFound('Subject');

  res.json({ success: true, message: 'Subject updated', data: { subject } });
};

export const deleteSubject = async (req, res) => {
  const subject = await subjectModel.delete(req.params.id);
  if (!subject) notFound('Subject');

  res.json({ success: true, message: 'Subject deleted' });
};

export const listTopics = async (req, res) => {
  const { page, limit, subjectId, classId, termId, levelCode } = req.query;

  const { data, pagination } = await topicModel.list({
    page, limit, subjectId, classId, termId, levelCode,
  });

  res.json({ success: true, data: { topics: data }, pagination });
};

export const getTopic = async (req, res) => {
  const topic = await topicModel.findById(req.params.id);
  if (!topic) notFound('Topic');

  const subtopics = await subtopicModel.listByTopic(topic.id);

  res.json({ success: true, data: { topic: { ...topic, subtopics } } });
};

export const createTopic = async (req, res) => {
  const topic = await topicModel.create(req.body);
  if (!topic) notFound('Subject');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Topic created',
    data: { topic },
  });
};

export const updateTopic = async (req, res) => {
  const topic = await topicModel.update(req.params.id, req.body);
  if (!topic) notFound('Topic');

  res.json({ success: true, message: 'Topic updated', data: { topic } });
};

export const deleteTopic = async (req, res) => {
  const topic = await topicModel.delete(req.params.id);
  if (!topic) notFound('Topic');

  res.json({ success: true, message: 'Topic deleted' });
};

export const listSubtopics = async (req, res) => {
  const { topicId } = req.query;

  const subtopics = topicId
    ? await subtopicModel.listByTopic(topicId)
    : await query('SELECT * FROM subtopics WHERE is_active = TRUE ORDER BY order_index').then(r => r.rows);

  res.json({ success: true, data: { subtopics } });
};

export const getSubtopic = async (req, res) => {
  const subtopic = await subtopicModel.findById(req.params.id);
  if (!subtopic) notFound('Subtopic');

  res.json({ success: true, data: { subtopic } });
};

export const createSubtopic = async (req, res) => {
  const subtopic = await subtopicModel.create(req.body);
  if (!subtopic) notFound('Topic');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Subtopic created',
    data: { subtopic },
  });
};

export const updateSubtopic = async (req, res) => {
  const subtopic = await subtopicModel.update(req.params.id, req.body);
  if (!subtopic) notFound('Subtopic');

  res.json({ success: true, message: 'Subtopic updated', data: { subtopic } });
};

export const deleteSubtopic = async (req, res) => {
  const subtopic = await subtopicModel.delete(req.params.id);
  if (!subtopic) notFound('Subtopic');

  res.json({ success: true, message: 'Subtopic deleted' });
};

export const getCurriculumTree = async (req, res) => {
  const result = await query(
    `SELECT s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
            t.id AS topic_id, t.name AS topic_name,
            st.id AS subtopic_id, st.name AS subtopic_name
     FROM subjects s
     LEFT JOIN topics t ON t.subject_id = s.id AND t.is_active = TRUE
     LEFT JOIN subtopics st ON st.topic_id = t.id AND st.is_active = TRUE
     WHERE s.is_active = TRUE
     ORDER BY s.order_index, t.order_index, st.order_index`
  );

  const tree = [];
  for (const row of result.rows) {
    let subject = tree.find(x => x.id === row.subject_id);
    if (!subject) {
      subject = { id: row.subject_id, name: row.subject_name, code: row.subject_code, topics: [] };
      tree.push(subject);
    }
    if (row.topic_id && !subject.topics.some(x => x.id === row.topic_id)) {
      subject.topics.push({ id: row.topic_id, name: row.topic_name, subtopics: [] });
    }
    const topic = subject.topics.find(x => x.id === row.topic_id);
    if (row.subtopic_id && topic && !topic.subtopics.some(x => x.id === row.subtopic_id)) {
      topic.subtopics.push({ id: row.subtopic_id, name: row.subtopic_name });
    }
  }

  res.json({ success: true, data: { curriculum: tree } });
};
