import { query, closePool } from '../src/common/database/index.js';
import { slugify } from '../src/common/utils/index.js';

const cleanup = async () => {
  await query('DELETE FROM quiz_questions');
  await query('DELETE FROM quiz_attempts');
  await query('DELETE FROM quizzes');
  console.log('Cleared quizzes');
};

const buildQuizzes = async () => {
  const courseResult = await query("SELECT id FROM courses WHERE status = 'published' LIMIT 1");
  if (!courseResult.rows.length) {
    console.log('No published courses found');
    return 0;
  }
  const courseId = courseResult.rows[0].id;

  const subjects = await query("SELECT id FROM subjects WHERE code = 'BIO'");
  if (!subjects.rows.length) {
    console.log('No Biology subject found');
    return 0;
  }
  const subjectId = subjects.rows[0].id;

  const teacherResult = await query("SELECT id FROM users WHERE email = 'teacher@learnforge.ng'");
  const teacherId = teacherResult.rows[0]?.id || null;

  const questions = await query(
    `SELECT q.id, q.question_text, q.difficulty, q.marks, q.topic_id
     FROM questions q WHERE q.subject_id = $1 AND q.is_active = TRUE`,
    [subjectId]
  );

  if (!questions.rows.length) {
    console.log('No biology questions found');
    return 0;
  }

  let quizzesCreated = 0;
  const topicGroups = {};
  for (const q of questions.rows) {
    const key = q.topic_id || 'general';
    if (!topicGroups[key]) topicGroups[key] = [];
    topicGroups[key].push(q);
  }

  for (const [key, topicQuestions] of Object.entries(topicGroups)) {
    if (key === 'general' && Object.keys(topicGroups).length > 1) continue;
    if (topicQuestions.length < 3) continue;

    const topicResult = await query('SELECT name FROM topics WHERE id = $1', [key]);
    const topicName = topicResult.rows[0]?.name || 'General';
    const title = `SS2 Biology — ${topicName} Quiz`;
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const totalMarks = topicQuestions.reduce((s, q) => s + (parseFloat(q.marks) || 1), 0);
    const passingScore = Math.round(totalMarks * 0.5);

    const quizResult = await query(
      `INSERT INTO quizzes (course_id, title, description, instructions, time_limit_minutes, passing_score, max_attempts, shuffle_questions, show_explanation, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE, TRUE)
       RETURNING id`,
      [
        courseId, title,
        `Practice quiz on ${topicName} — ${topicQuestions.length} questions`,
        `Answer all ${topicQuestions.length} questions. Good luck!`,
        Math.min(topicQuestions.length * 2, 30),
        passingScore,
        3,
      ]
    );

    const quizId = quizResult.rows[0].id;
    for (let i = 0; i < topicQuestions.length; i++) {
      await query(
        `INSERT INTO quiz_questions (quiz_id, question_id, order_index, marks)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [quizId, topicQuestions[i].id, i, parseFloat(topicQuestions[i].marks) || 1]
      );
    }
    console.log(`Created: ${title} (${topicQuestions.length} questions)`);
    quizzesCreated++;
  }

  // General quiz
  const genTitle = 'SS2 Biology — General Practice Quiz';
  const genSlug = `ss2-biology-general-${Date.now().toString(36)}`;
  const genTotal = questions.rows.reduce((s, q) => s + (parseFloat(q.marks) || 1), 0);
  const genResult = await query(
    `INSERT INTO quizzes (course_id, title, description, instructions, time_limit_minutes, passing_score, max_attempts, shuffle_questions, show_explanation, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE, TRUE)
     ON CONFLICT DO NOTHING RETURNING id`,
    [
      courseId, genTitle,
      `General SS2 Biology practice — ${questions.rows.length} questions covering all topics`,
      'Answer all questions. You have unlimited attempts.',
      Math.min(questions.rows.length * 2, 45),
      Math.round(genTotal * 0.5),
      99,
    ]
  );

  if (genResult.rows.length) {
    const quizId = genResult.rows[0].id;
    for (let i = 0; i < questions.rows.length; i++) {
      await query(
        `INSERT INTO quiz_questions (quiz_id, question_id, order_index, marks)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [quizId, questions.rows[i].id, i, parseFloat(questions.rows[i].marks) || 1]
      );
    }
    console.log(`Created: ${genTitle} (${questions.rows.length} questions)`);
    quizzesCreated++;
  } else {
    console.log('General quiz already exists');
  }

  console.log(`Total quizzes created: ${quizzesCreated}`);
  return quizzesCreated;
};

const run = async () => {
  await cleanup();
  await buildQuizzes();
  const result = await query('SELECT COUNT(*) as total FROM quizzes');
  console.log(`Quizzes in database: ${result.rows[0].total}`);
  await closePool();
};

run().catch(err => { console.error('Quiz seed failed:', err); closePool(); process.exit(1); });
