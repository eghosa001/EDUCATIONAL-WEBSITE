import { query, closePool } from '../src/common/database/index.js';
import { slugify } from '../src/common/utils/index.js';

const TEACHER_ID = null; // resolved dynamically

const cleanup = async () => {
  await query('DELETE FROM exam_answers');
  await query('DELETE FROM exam_attempts');
  await query('DELETE FROM exam_questions');
  await query('DELETE FROM exams');
  console.log('Cleared exams and related tables');
};

const slug = (title) => {
  const base = slugify(title);
  return `${base}-${Date.now().toString(36)}`;
};

const buildExams = async () => {
  const teacherResult = await query("SELECT id FROM users WHERE email = 'teacher@learnforge.ng'");
  if (!teacherResult.rows.length) {
    console.log('Teacher user not found. Run db:seed first.');
    return 0;
  }
  const teacherId = teacherResult.rows[0].id;

  const rows = await query(
    `SELECT q.id as question_id, q.question_text, q.difficulty, q.marks,
            q.exam_name, q.exam_year, s.name as subject_name, s.id as subject_id,
            t.name as topic_name
     FROM questions q
     JOIN subjects s ON s.id = q.subject_id
     LEFT JOIN topics t ON t.id = q.topic_id
     ORDER BY q.exam_name, s.name, q.exam_year, q.difficulty`
  );

  if (!rows.rows.length) {
    console.log('No questions found. Run db:seed first.');
    return;
  }

  const grouped = {};
  for (const row of rows.rows) {
    const key = `${row.exam_name}||${row.subject_name}`;
    if (!grouped[key]) {
      grouped[key] = {
        examName: row.exam_name,
        subjectName: row.subject_name,
        subjectId: row.subject_id,
        years: [...new Set(rows.rows.filter(r => r.exam_name === row.exam_name && r.subject_name === row.subject_name).map(r => r.exam_year))],
        questions: [],
      };
    }
    grouped[key].questions.push({
      id: row.question_id,
      marks: parseFloat(row.marks) || 1,
      difficulty: row.difficulty,
    });
  }

  let examsCreated = 0;

  for (const [key, group] of Object.entries(grouped)) {
    const yearLabel = group.years.sort((a, b) => a - b).join('-');
    const title = `${group.examName} ${group.subjectName} Practice (${yearLabel})`;
    const description = `Practice questions for ${group.examName} ${group.subjectName} examination — ${group.questions.length} questions from ${yearLabel} past papers.`;
    const questionCount = group.questions.length;
    const durationMinutes = Math.max(questionCount * 1, 20);
    const totalMarks = group.questions.reduce((sum, q) => sum + q.marks, 0);
    const passingMarks = Math.round(totalMarks * 0.5);

    const examResult = await query(
      `INSERT INTO exams (title, slug, description, exam_type, subject_id, duration_minutes, total_marks, passing_marks, instructions, is_timed, shuffle_questions, show_results_immediately, allow_review, max_attempts, is_active, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE, TRUE, TRUE, 999, TRUE, TRUE, $10)
       RETURNING id`,
      [
        title,
        slug(title),
        description,
        'past_questions',
        group.subjectId,
        durationMinutes,
        totalMarks,
        passingMarks,
        `This is a practice ${group.examName} ${group.subjectName} exam with ${questionCount} questions. You have ${durationMinutes} minutes. Good luck!`,
        teacherId,
      ]
    );

    const examId = examResult.rows[0].id;

    for (let i = 0; i < group.questions.length; i++) {
      await query(
        `INSERT INTO exam_questions (exam_id, question_id, order_index, marks, section_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [examId, group.questions[i].id, i, group.questions[i].marks, 'Multiple Choice']
      );
    }

    console.log(`Created: ${title} (${questionCount} questions, ${durationMinutes}min, ${totalMarks} marks)`);
    examsCreated++;
  }

  console.log(`\nTotal exams created: ${examsCreated}`);
  return examsCreated;
};

const run = async () => {
  await cleanup();
  await buildExams();
  const result = await query('SELECT COUNT(*) as total FROM exams');
  console.log(`Exams in database: ${result.rows[0].total}`);
  await closePool();
  console.log('Done.');
};

run().catch((error) => {
  console.error('Exam seed failed:', error);
  closePool();
  process.exit(1);
});
