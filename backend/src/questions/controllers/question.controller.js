import { questionModel } from '../models/question.model.js';
import { transaction } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const roleSet = (user) => new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
const isQuestionReader = (user) => {
  const roles = roleSet(user);
  return roles.has('teacher') || roles.has('content_admin') || roles.has('super_admin');
};
const isGlobalQuestionManager = (user) => {
  const roles = roleSet(user);
  return roles.has('content_admin') || roles.has('super_admin');
};
const canManageQuestion = (user, question) => isGlobalQuestionManager(user) || (roleSet(user).has('teacher') && question?.created_by === user?.id);
const requireQuestionManager = (req, question) => {
  if (!canManageQuestion(req.user, question)) {
    throw new AppError('Not authorized to manage this question', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
};

const serialize = (q, includeAnswerKey = false) => ({
  id: q.id,
  subjectId: q.subject_id,
  topicId: q.topic_id,
  subtopicId: q.subtopic_id,
  classId: q.class_id,
  questionType: q.question_type,
  questionText: q.question_text,
  questionImageUrl: q.question_image_url,
  options: q.options,
  ...(includeAnswerKey ? {
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    explanationImageUrl: q.explanation_image_url,
  } : {}),
  difficulty: q.difficulty,
  marks: q.marks,
  negativeMarks: q.negative_marks,
  timeLimitSeconds: q.time_limit_seconds,
  source: q.source,
  examYear: q.exam_year,
  examName: q.exam_name,
  tags: q.tags,
  isActive: q.is_active,
  reviewedAt: q.reviewed_at,
  createdAt: q.created_at,
});

export const listQuestions = async (req, res) => {
  const { page, limit, subjectId, topicId, classId, difficulty, questionType, examName, examYear, search, isActive } = req.query;
  const globalManager = isGlobalQuestionManager(req.user);
  const effectiveActive = globalManager && isActive !== undefined ? isActive === 'true' || isActive === true : true;

  const { data, pagination } = await questionModel.list({
    page, limit, subjectId, topicId, classId, difficulty, questionType, examName, examYear, search,
    isActive: effectiveActive,
  });

  const includeAnswerKey = isQuestionReader(req.user);
  res.json({ success: true, data: { questions: data.map((q) => serialize(q, includeAnswerKey)) }, pagination });
};

export const getQuestion = async (req, res) => {
  const question = await questionModel.findById(req.params.id);
  if (!question) notFound('Question');
  if (!question.is_active && !canManageQuestion(req.user, question)) notFound('Question');

  res.json({ success: true, data: { question: serialize(question, isQuestionReader(req.user)) } });
};

export const createQuestion = async (req, res) => {
  const question = await questionModel.create({ ...req.body, createdBy: req.user.id });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Question created',
    data: { question: serialize(question, true) },
  });
};

export const bulkImportQuestions = async (req, res) => {
  const { questions } = req.body;

  const created = await transaction(async (client) => {
    const rows = [];
    for (const question of questions) {
      const { rows: inserted } = await client.query(
        `INSERT INTO questions (
           subject_id, topic_id, subtopic_id, class_id, question_type, question_text,
           question_image_url, options, correct_answer, explanation, explanation_image_url,
           difficulty, marks, negative_marks, time_limit_seconds, source, exam_year,
           exam_name, tags, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         RETURNING *`,
        [
          question.subjectId, question.topicId, question.subtopicId, question.classId,
          question.questionType, question.questionText, question.questionImageUrl,
          JSON.stringify(question.options), JSON.stringify(question.correctAnswer), question.explanation,
          question.explanationImageUrl, question.difficulty, question.marks,
          question.negativeMarks, question.timeLimitSeconds, question.source,
          question.examYear, question.examName, JSON.stringify(question.tags), req.user.id,
        ]
      );
      rows.push(inserted[0]);
    }
    return rows;
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `${created.length} questions imported`,
    data: { questions: created.map((q) => serialize(q, true)) },
  });
};

export const updateQuestion = async (req, res) => {
  const existing = await questionModel.findById(req.params.id);
  if (!existing) notFound('Question');
  requireQuestionManager(req, existing);

  const question = await questionModel.update(req.params.id, req.body);
  if (!question) notFound('Question');

  res.json({ success: true, message: 'Question updated', data: { question: serialize(question, true) } });
};

export const reviewQuestion = async (req, res) => {
  if (!isGlobalQuestionManager(req.user)) {
    throw new AppError('Content administrator access required', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  const question = await questionModel.review(req.params.id, req.user.id);
  if (!question) notFound('Question');

  res.json({ success: true, message: 'Question reviewed', data: { question: serialize(question, true) } });
};

export const deleteQuestion = async (req, res) => {
  const existing = await questionModel.findById(req.params.id);
  if (!existing) notFound('Question');
  requireQuestionManager(req, existing);

  const question = await questionModel.delete(req.params.id);
  if (!question) notFound('Question');

  res.json({ success: true, message: 'Question deleted' });
};
