/**
 * Generate practice exams and mock exams from the question bank.
 * Creates exams for each board/subject combination with randomized questions.
 */
import { query, closePool } from '../src/common/database/index.js';

const EXAM_CONFIGS = [
  { name: 'WAEC', type: 'past_questions', subjects: ['MATHEMATICS', 'ENGLISH LANGUAGE', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'AGRICULTURAL SCIENCE', 'ECONOMICS', 'GOVERNMENT', 'LITERATURE IN ENGLISH', 'FRENCH'], duration: 180, questionsPerExam: 50 },
  { name: 'NECO', type: 'past_questions', subjects: ['MATHEMATICS', 'ENGLISH LANGUAGE', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'AGRICULTURAL SCIENCE'], duration: 150, questionsPerExam: 45 },
  { name: 'JAMB', type: 'past_questions', subjects: ['ENGLISH LANGUAGE', 'MATHEMATICS', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'ECONOMICS', 'GOVERNMENT'], duration: 120, questionsPerExam: 40 },
  { name: 'NABTEB', type: 'past_questions', subjects: ['MATHEMATICS', 'ENGLISH', 'TECHNICAL DRAWING', 'CIVIC EDUCATION'], duration: 120, questionsPerExam: 40 },
  { name: 'POST-UTME', type: 'past_questions', subjects: ['ENGLISH LANGUAGE', 'MATHEMATICS', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS'], duration: 60, questionsPerExam: 20 },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
}

async function main() {
  console.log('=== Exam Generator ===\n');

  // Get subjects with their IDs
  const subjectsRes = await query(`SELECT id, name FROM subjects WHERE is_active = TRUE ORDER BY name`);
  const subjectMap = {};
  for (const s of subjectsRes.rows) {
    subjectMap[s.name.toUpperCase()] = s.id;
  }
  console.log(`Loaded ${Object.keys(subjectMap).length} subjects\n`);

  let examsCreated = 0;
  let totalQuestionsAdded = 0;

  for (const config of EXAM_CONFIGS) {
    console.log(`\n📝 ${config.name} (${config.type}):`);

    for (const subjectName of config.subjects) {
      const subjectId = subjectMap[subjectName.toUpperCase()];
      if (!subjectId) continue;

      // Get available questions for this subject
      const questionsRes = await query(
        `SELECT id, question_text, options, correct_answer, difficulty, marks, source, exam_year
         FROM questions 
         WHERE subject_id = $1 AND is_active = TRUE AND question_type = 'mcq'
         ORDER BY RANDOM()`,
        [subjectId]
      );

      if (questionsRes.rows.length === 0) continue;

      // Create 2-3 exams per subject
      const numExams = Math.min(3, Math.ceil(questionsRes.rows.length / config.questionsPerExam));
      
      for (let examNum = 1; examNum <= numExams; examNum++) {
        const selectedQuestions = questionsRes.rows.slice(
          (examNum - 1) * config.questionsPerExam,
          examNum * config.questionsPerExam
        );

        if (selectedQuestions.length < 5) continue;

        const examTitle = `${config.name} ${subjectName} Practice Test ${examNum} (${selectedQuestions[0]?.exam_year || '2023'})`;
        const examSlug = slugify(`${config.name}-${subjectName.toLowerCase()}-practice-${examNum}`);

        // Check if exam exists
        const existing = await query(`SELECT id FROM exams WHERE slug = $1 LIMIT 1`, [examSlug]);
        if (existing.rows[0]) continue;

        // Create exam
        const exam = await query(
          `INSERT INTO exams (
            title, slug, description, exam_type, subject_id, 
            duration_minutes, total_marks, passing_marks, instructions,
            is_timed, shuffle_questions, show_results_immediately,
            allow_review, max_attempts, is_active, is_public
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id`,
          [
            examTitle,
            examSlug,
            `${config.name} ${subjectName} practice exam with ${selectedQuestions.length} questions.`,
            config.type,
            subjectId,
            config.duration,
            selectedQuestions.length,
            Math.ceil(selectedQuestions.length * 0.5),
            `Answer all questions. Time limit: ${config.duration} minutes.`,
            true, true, true, true, 3, true, true,
          ]
        );

        const examId = exam.rows[0].id;
        examsCreated++;

        // Add questions to exam
        for (let i = 0; i < selectedQuestions.length; i++) {
          await query(
            `INSERT INTO exam_questions (exam_id, question_id, order_index, marks)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [examId, selectedQuestions[i].id, i + 1, parseFloat(selectedQuestions[i].marks) || 1]
          );
          totalQuestionsAdded++;
        }

        console.log(`  ✓ ${subjectName}: ${selectedQuestions.length} questions`);
      }
    }
  }

  // Create quick practice quizzes (shorter, 10-20 questions)
  console.log('\n📋 Creating quick practice quizzes...');
  let quizzesCreated = 0;

  const quickSubjects = Object.keys(subjectMap).slice(0, 10);
  for (const subjName of quickSubjects) {
    const subjectId = subjectMap[subjName];
    const questionsRes = await query(
      `SELECT id FROM questions WHERE subject_id = $1 AND is_active = TRUE AND question_type = 'mcq'
       ORDER BY RANDOM() LIMIT 30`,
      [subjectId]
    );

    if (questionsRes.rows.length < 10) continue;

    // Create a quick quiz
    const quizTitle = `Quick Practice: ${subjName}`;
    
    const existing = await query(`SELECT id FROM quizzes WHERE title = $1 AND is_active = TRUE LIMIT 1`, [quizTitle]);
    if (existing.rows[0]) continue;

    const quiz = await query(
      `INSERT INTO quizzes (course_id, title, description, time_limit_minutes, passing_score, max_attempts, shuffle_questions, show_explanation, is_active)
       VALUES (NULL, $1, $2, 15, 50, 5, TRUE, TRUE, TRUE)
       RETURNING id`,
      [
        quizTitle,
        `Quick ${subjName} practice quiz with 20 questions.`,
      ]
    );

    const quizId = quiz.rows[0].id;
    quizzesCreated++;

    // Add 20 random questions
    for (let i = 0; i < Math.min(20, questionsRes.rows.length); i++) {
      await query(
        `INSERT INTO quiz_questions (quiz_id, question_id, order_index, marks)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT DO NOTHING`,
        [quizId, questionsRes.rows[i].id, i + 1]
      );
    }

    console.log(`  ✓ ${subjName}: 20 questions`);
  }

  console.log(`\n✅ Exam generation complete:`);
  console.log(`   Exams created:    ${examsCreated}`);
  console.log(`   Quiz questions:   ${totalQuestionsAdded}`);
  console.log(`   Quick quizzes:    ${quizzesCreated}`);

  // Verify
  const verify = await query(`
    SELECT 
      (SELECT COUNT(*) FROM exams) as exams,
      (SELECT COUNT(*) FROM quizzes) as quizzes,
      (SELECT COUNT(*) FROM exam_questions) as exam_questions,
      (SELECT COUNT(*) FROM quiz_questions) as quiz_questions,
      (SELECT COUNT(*) FROM questions WHERE question_type = 'mcq') as mcq_questions,
      (SELECT COUNT(*) FROM questions WHERE question_type = 'essay') as essay_questions,
      (SELECT COUNT(*) FROM questions WHERE question_type = 'numerical') as numerical_questions,
      (SELECT COUNT(*) FROM questions WHERE question_type = 'true_false') as true_false_questions
  `);
  console.log('\nVerification:');
  for (const row of verify.rows) {
    console.log(`   ${JSON.stringify(row)}`);
  }

  await closePool();
}

main().catch(err => {
  console.error('❌ Exam generation failed:', err);
  closePool().finally(() => process.exit(1));
});
