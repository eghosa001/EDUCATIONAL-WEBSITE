import { query, getClient, transaction } from '../common/database/index.js';
import { AppError } from '../common/errors/index.js';
import { HTTP_STATUS } from '../common/constants/index.js';

const DIFFICULTY_WEIGHTS = { easy: 0.5, medium: 1.0, hard: 1.5 };
const QUESTION_TYPES = ['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'numerical'];

export const assessmentEngine = {
  async generateRandomQuiz(params) {
    const {
      subjectId, topicId, subtopicId, classId,
      count = 10, difficulty, questionTypes, timeLimitMinutes = 30,
      excludeQuestionIds = [],
    } = params;

    if (count < 1 || count > 100) {
      throw new AppError('Question count must be between 1 and 100', HTTP_STATUS.BAD_REQUEST, 'INVALID_PARAMS');
    }

    const conditions = [];
    const values = [];

    if (subjectId) {
      conditions.push(`subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (topicId) {
      conditions.push(`topic_id = $${values.length + 1}`);
      values.push(topicId);
    }
    if (subtopicId) {
      conditions.push(`subtopic_id = $${values.length + 1}`);
      values.push(subtopicId);
    }
    if (classId) {
      conditions.push(`class_id = $${values.length + 1}`);
      values.push(classId);
    }
    if (difficulty) {
      conditions.push(`difficulty = $${values.length + 1}`);
      values.push(difficulty);
    }
    if (questionTypes && questionTypes.length > 0) {
      conditions.push(`question_type = ANY($${values.length + 1}::text[])`);
      values.push(questionTypes);
    }
    if (excludeQuestionIds.length > 0) {
      conditions.push(`id != ALL($${values.length + 1}::text[])`);
      values.push(excludeQuestionIds);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM questions ${whereClause} ORDER BY RANDOM() LIMIT $${values.length + 1}`,
      [...values, count]
    );

    if (result.rows.length === 0) {
      throw new AppError('No questions found matching criteria', HTTP_STATUS.NOT_FOUND, 'NO_QUESTIONS_FOUND');
    }

    return {
      questions: result.rows,
      timeLimitMinutes,
      totalMarks: result.rows.reduce((sum, q) => sum + (q.marks || 1), 0),
    };
  },

  async generateWeightedQuiz(params) {
    const { subjectId, topicId, count = 20, difficultyDistribution = { easy: 0.3, medium: 0.5, hard: 0.2 } } = params;

    const results = [];
    for (const [difficulty, weight] of Object.entries(difficultyDistribution)) {
      const questionCount = Math.ceil(count * weight);
      const questions = await this.generateRandomQuiz({
        ...params,
        difficulty,
        count: questionCount,
      });
      results.push(...questions.questions);
    }

    return {
      questions: results.sort(() => Math.random() - 0.5),
      timeLimitMinutes: Math.ceil(count * 1.5),
      totalMarks: results.reduce((sum, q) => sum + (q.marks || 1), 0),
    };
  },

  async generateTopicQuiz(topicId, count = 15) {
    const topic = await query('SELECT * FROM topics WHERE id = $1', [topicId]);
    if (!topic.rows[0]) throw new AppError('Topic not found', HTTP_STATUS.NOT_FOUND, 'TOPIC_NOT_FOUND');

    return this.generateRandomQuiz({ topicId, count });
  },

  async generateSubjectQuiz(subjectId, count = 30) {
    const subject = await query('SELECT * FROM subjects WHERE id = $1', [subjectId]);
    if (!subject.rows[0]) throw new AppError('Subject not found', HTTP_STATUS.NOT_FOUND, 'SUBJECT_NOT_FOUND');

    const topics = await query('SELECT id FROM topics WHERE subject_id = $1', [subjectId]);
    if (topics.rows.length === 0) throw new AppError('No topics found for subject', HTTP_STATUS.NOT_FOUND, 'NO_TOPICS');

    const questionsPerTopic = Math.ceil(count / topics.rows.length);
    const allQuestions = [];

    for (const topic of topics.rows) {
      const questions = await this.generateRandomQuiz({
        topicId: topic.id,
        count: questionsPerTopic,
      });
      allQuestions.push(...questions.questions);
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, count);
    return {
      questions: shuffled,
      timeLimitMinutes: Math.ceil(shuffled.length * 1.5),
      totalMarks: shuffled.reduce((sum, q) => sum + (q.marks || 1), 0),
    };
  },

  async generateExamFromCurriculum(educationLevel, classId, termId, params = {}) {
    const { count = 50, difficulty } = params;

    const classes = await query(
      `SELECT id FROM classes WHERE education_level_id = $1 AND id = $2`,
      [educationLevel, classId]
    );

    if (classes.rows.length === 0) {
      throw new AppError('Class not found', HTTP_STATUS.NOT_FOUND, 'CLASS_NOT_FOUND');
    }

    const subjects = await query(
      `SELECT id, name FROM subjects WHERE class_id = $1`,
      [classId]
    );

    const questionsPerSubject = Math.ceil(count / subjects.rows.length);
    const allQuestions = [];

    for (const subject of subjects.rows) {
      const questions = await this.generateRandomQuiz({
        subjectId: subject.id,
        count: questionsPerSubject,
        difficulty,
      });
      allQuestions.push(...questions.questions);
    }

    return {
      questions: allQuestions.sort(() => Math.random() - 0.5).slice(0, count),
      timeLimitMinutes: Math.ceil(count * 2),
      totalMarks: allQuestions.slice(0, count).reduce((sum, q) => sum + (q.marks || 1), 0),
    };
  },

  async validateAnswer(questionId, userAnswer) {
    const question = await query('SELECT * FROM questions WHERE id = $1', [questionId]);
    if (!question.rows[0]) throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND, 'QUESTION_NOT_FOUND');

    const correctAnswer = question.rows[0].correctAnswer;
    let isCorrect = false;

    if (typeof correctAnswer === 'object' && correctAnswer !== null) {
      isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    } else {
      isCorrect = String(userAnswer) === String(correctAnswer);
    }

    return { isCorrect, correctAnswer, explanation: question.rows[0].explanation };
  },

  async calculateScore(answers, questions) {
    let correct = 0;
    let totalMarks = 0;
    let earnedMarks = 0;

    for (const question of questions) {
      totalMarks += question.marks || 1;
      const userAnswer = answers[question.id];
      if (userAnswer) {
        const result = await this.validateAnswer(question.id, userAnswer);
        if (result.isCorrect) {
          correct++;
          earnedMarks += question.marks || 1;
        }
      }
    }

    return {
      correctAnswers: correct,
      totalQuestions: questions.length,
      earnedMarks,
      totalMarks,
      percentage: questions.length > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0,
      passed: questions.length > 0 ? (earnedMarks / totalMarks) >= 0.5 : false,
    };
  },

  async generateAdaptiveQuiz(userId, subjectId, initialDifficulty = 'medium') {
    const userHistory = await query(
      `SELECT q.subject_id, COUNT(*) FILTER (WHERE ea.is_correct) as correct,
              COUNT(*) as total, AVG(q.difficulty) as avg_difficulty
       FROM exam_attempts ea
       JOIN exam_questions eq ON ea.exam_question_id = eq.id
       JOIN questions q ON eq.question_id = q.id
       WHERE ea.user_id = $1 AND q.subject_id = $2
       GROUP BY q.subject_id
       LIMIT 1`,
      [userId, subjectId]
    );

    let currentDifficulty = initialDifficulty;
    if (userHistory.rows[0]) {
      const accuracy = userHistory.rows[0].correct / userHistory.rows[0].total;
      if (accuracy < 0.4) currentDifficulty = 'easy';
      else if (accuracy > 0.8) currentDifficulty = 'hard';
    }

    return this.generateRandomQuiz({ subjectId, count: 10, difficulty: currentDifficulty });
  },
};

export default assessmentEngine;
