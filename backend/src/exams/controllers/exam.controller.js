import { examModel } from '../models/exam.model.js';
import { examQuestionModel } from '../models/examQuestion.model.js';
import { examAttemptModel } from '../models/examAttempt.model.js';
import { questionModel } from '../../questions/models/question.model.js';
import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { EXAM_ATTEMPT_STATUS } from '../../common/constants/index.js';
import { slugify } from '../../common/utils/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const normalize = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim().replace(/\s+/g, ' ');
};

export const listExams = async (req, res) => {
  const { page, limit, examType, subjectId, classId, isPublic } = req.query;

  const { data, pagination } = await examModel.list({
    page, limit, examType, subjectId, classId,
    isPublic: isPublic === undefined ? undefined : isPublic === 'true',
  });

  res.json({ success: true, data: { exams: data }, pagination });
};

export const getExam = async (req, res) => {
  const exam = await examModel.findById(req.params.id);
  if (!exam) notFound('Exam');

  const stats = await examQuestionModel.countByExam(exam.id);

  res.json({
    success: true,
    data: {
      exam,
      stats: {
        questionCount: stats.total,
        totalMarks: parseFloat(stats.total_marks) || 0,
      },
    },
  });
};

export const createExam = async (req, res) => {
  let slug = slugify(req.body.title);
  if (await examModel.findBySlug(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const exam = await examModel.create({ ...req.body, slug, createdBy: req.user.id });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Exam created',
    data: { exam },
  });
};

export const publishExam = async (req, res) => {
  const exam = await examModel.findById(req.params.id);
  if (!exam) notFound('Exam');

  const updated = await examModel.update(exam.id, { isActive: true });

  res.json({
    success: true,
    message: 'Exam published',
    data: { exam: updated },
  });
};

export const updateExam = async (req, res) => {
  const exam = await examModel.update(req.params.id, req.body);
  if (!exam) notFound('Exam');

  res.json({ success: true, message: 'Exam updated', data: { exam } });
};

export const deleteExam = async (req, res) => {
  const exam = await examModel.delete(req.params.id);
  if (!exam) notFound('Exam');

  res.json({ success: true, message: 'Exam deleted' });
};

export const listExamQuestions = async (req, res) => {
  const exam = await examModel.findById(req.params.id);
  if (!exam) notFound('Exam');

  const questions = await examQuestionModel.listByExam(exam.id);

  res.json({ success: true, data: { questions } });
};

export const addQuestion = async (req, res) => {
  const { id } = req.params;
  const { questionId, orderIndex, marks, sectionName } = req.body;

  const exam = await examModel.findById(id);
  if (!exam) notFound('Exam');

  const question = await questionModel.findById(questionId);
  if (!question) notFound('Question');

  const entry = await examQuestionModel.addQuestion({ examId: id, questionId, orderIndex, marks, sectionName });
  if (!entry) {
    throw new AppError('Question already in exam', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }

  const stats = await examQuestionModel.countByExam(id);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Question added to exam',
    data: { entry, stats },
  });
};

export const removeQuestion = async (req, res) => {
  const { id, questionId } = req.params;

  await examQuestionModel.removeQuestion(id, questionId);

  res.json({ success: true, message: 'Question removed from exam' });
};

export const startAttempt = async (req, res) => {
  const { id } = req.params;

  const exam = await examModel.findById(id);
  if (!exam) notFound('Exam');

  if (!exam.is_active) {
    throw new AppError('Exam is not active', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (exam.start_time && new Date(exam.start_time) > new Date()) {
    throw new AppError('Exam has not started yet', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (exam.end_time && new Date(exam.end_time) < new Date()) {
    throw new AppError('Exam has ended', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const attemptCount = await examAttemptModel.countAttemptsByStudent(id, req.user.id);
  if (attemptCount >= exam.max_attempts) {
    throw new AppError('Maximum attempts reached for this exam', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const attempt = await examAttemptModel.create({ examId: id, studentId: req.user.id });

  const questions = await examQuestionModel.listByExam(id);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Exam attempt started',
    data: {
      attempt,
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.duration_minutes,
        isTimed: exam.is_timed,
        totalQuestions: questions.length,
      },
      questions: questions.map(q => ({
        id: q.id,
        orderIndex: q.order_index,
        questionId: q.question_id,
        questionText: q.question_text,
        questionType: q.question_type,
        options: q.options,
        marks: q.marks,
        sectionName: q.section_name,
        difficulty: q.difficulty,
        timeLimitSeconds: null,
      })),
    },
  });
};

export const submitAttempt = async (req, res) => {
  const { id, attemptId } = req.params;
  const { answers, timeSpentSeconds } = req.body;

  const attempt = await examAttemptModel.findById(attemptId);
  if (!attempt) notFound('Attempt');

  if (attempt.student_id !== req.user.id) {
    throw new AppError('Not your attempt', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  if (attempt.status === EXAM_ATTEMPT_STATUS.SUBMITTED) {
    throw new AppError('Attempt already submitted', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.CONFLICT);
  }

  const questionsResult = await examQuestionModel.listByExam(id);
  const questionMap = new Map(questionsResult.map(q => [q.question_id, q]));

  let score = 0;
  let totalMarks = 0;
  const graded = [];

  for (const question of questionsResult) {
    totalMarks += parseFloat(question.marks) || 1;
  }

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const marks = parseFloat(question.marks) || 1;
    const isCorrect = gradeAnswer(question, answer.studentAnswer);
    const marksObtained = isCorrect ? marks : 0;
    score += marksObtained;

    graded.push({
      questionId: answer.questionId,
      studentAnswer: answer.studentAnswer,
      isCorrect,
      marksObtained,
      timeSpentSeconds: answer.timeSpentSeconds || null,
    });
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

  const exam = await examModel.findById(id);
  const passed = percentage >= (exam?.passing_marks ? parseFloat(exam.passing_marks) : percentage > 0);

  const finalAttempt = await examAttemptModel.submitWithAnswers(attemptId, graded, {
    timeSpentSeconds: timeSpentSeconds || Math.round((Date.now() - new Date(attempt.started_at)) / 1000),
    score,
    percentage,
    isPassed: passed,
  });

  res.json({
    success: true,
    message: 'Attempt submitted',
    data: {
      attempt: finalAttempt,
      result: {
        score,
        totalMarks,
        percentage,
        isPassed: passed,
        correctCount: graded.filter(a => a.isCorrect).length,
        incorrectCount: graded.filter(a => !a.isCorrect).length,
        unansweredCount: questionsResult.length - graded.length,
        showResults: exam?.show_results_immediately ?? false,
      },
    },
  });
};

const gradeAnswer = (question, studentAnswer) => {
  const correct = question.correct_answer;
  const type = question.question_type;

  if (correct === null || correct === undefined) return false;

  switch (type) {
    case 'mcq':
    case 'true_false':
    case 'image_based':
      return normalize(correct) === normalize(studentAnswer);
    case 'multiple_select': {
      const expected = Array.isArray(correct) ? correct.map(normalize).sort() : [normalize(correct)].sort();
      const given = Array.isArray(studentAnswer) ? studentAnswer.map(normalize).sort() : [];
      return expected.length === given.length && expected.every((v, i) => v === given[i]);
    }
    case 'fill_blank':
    case 'short_answer':
    case 'numerical':
      return normalize(correct) === normalize(studentAnswer);
    case 'matching': {
      if (!correct || !studentAnswer) return false;
      const expected = new Map(Object.entries(correct).map(([k, v]) => [normalize(k), normalize(v)]));
      const given = new Map(Object.entries(studentAnswer).map(([k, v]) => [normalize(k), normalize(v)]));
      if (expected.size !== given.size) return false;
      for (const [k, v] of given) {
        if (expected.get(k) !== v) return false;
      }
      return true;
    }
    case 'essay':
      return false;
    default:
      return normalize(correct) === normalize(studentAnswer);
  }
};

export const getMyAttempts = async (req, res) => {
  const { page, limit } = req.query;

  const { data, pagination } = await examAttemptModel.listByStudent(req.user.id, { page, limit });

  res.json({ success: true, data: { attempts: data }, pagination });
};

export const listAttempts = async (req, res) => {
  const { page, limit } = req.query;

  const { data, pagination } = await examAttemptModel.listByExam(req.params.id, { page, limit });

  res.json({ success: true, data: { attempts: data }, pagination });
};

export const getAttempt = async (req, res) => {
  const { id, attemptId } = req.params;

  const attempt = await examAttemptModel.findById(attemptId);
  if (!attempt) notFound('Attempt');

  if (attempt.exam_id !== id) notFound('Attempt');

  const canView = req.user.id === attempt.student_id || req.user.role !== 'student';
  if (!canView && attempt.status !== EXAM_ATTEMPT_STATUS.SUBMITTED) {
    throw new AppError('Not authorized to view this attempt', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const answers = await query(
    `SELECT ea.*, q.question_text, q.question_type, q.options, q.correct_answer, q.explanation
     FROM exam_answers ea
     JOIN questions q ON q.id = ea.question_id
     WHERE ea.attempt_id = $1
     ORDER BY ea.answered_at`,
    [attemptId]
  );

  res.json({ success: true, data: { attempt, answers: answers.rows } });
};

export const getLeaderboard = async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT ea.attempt_number, ea.score, ea.percentage, ea.is_passed, ea.submitted_at,
            u.id AS user_id, u.first_name, u.last_name, u.avatar_url
     FROM exam_attempts ea
     JOIN users u ON u.id = ea.student_id
     WHERE ea.exam_id = $1 AND ea.status = 'submitted'
     ORDER BY ea.percentage DESC, ea.time_spent_seconds ASC
     LIMIT 50`,
    [id]
  );

  const leaderboard = result.rows.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));

  res.json({ success: true, data: { leaderboard } });
};
