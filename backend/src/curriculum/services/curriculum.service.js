import { query } from '../../common/database/index.js';
import subjectModel from '../models/subject.model.js';
import topicModel from '../models/topic.model.js';
import subtopicModel from '../models/subtopic.model.js';

export const curriculumService = {
  async getAllSubjects(params) {
    return subjectModel.list(params);
  },

  async getSubjectById(id) {
    const subject = await subjectModel.findById(id);
    if (!subject) throw new Error('Subject not found');
    return subject;
  },

  async createSubject(data) {
    return subjectModel.create(data);
  },

  async updateSubject(id, data) {
    return subjectModel.update(id, data);
  },

  async deleteSubject(id) {
    return subjectModel.delete(id);
  },

  async getAllTopics(params) {
    return topicModel.list(params);
  },

  async getTopicById(id) {
    return topicModel.findById(id);
  },

  async createTopic(data) {
    return topicModel.create(data);
  },

  async updateTopic(id, data) {
    return topicModel.update(id, data);
  },

  async deleteTopic(id) {
    return topicModel.delete(id);
  },

  async getAllSubtopics(params) {
    return subtopicModel.list(params);
  },

  async getSubtopicsByTopic(topicId) {
    return subtopicModel.listByTopic(topicId);
  },

  async createSubtopic(data) {
    return subtopicModel.create(data);
  },

  async getSubjectCurriculum(subjectId) {
    const subject = await subjectModel.findById(subjectId);
    if (!subject) throw new Error('Subject not found');

    const topics = await topicModel.listBySubject(subjectId);
    const topicDetails = await Promise.all(
      topics.map(async (t) => {
        const subtopics = await subtopicModel.listByTopic(t.id);
        return { ...t, subtopics };
      })
    );
    return { subject, topics: topicDetails };
  },

  async searchSubjects(queryText) {
    const result = await query(
      `SELECT * FROM subjects WHERE name ILIKE $1 OR description ILIKE $2 LIMIT 20`,
      [`%${queryText}%`, `%${queryText}%`]
    );
    return result.rows;
  },
};

export default curriculumService;
