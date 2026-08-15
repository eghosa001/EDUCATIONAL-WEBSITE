/**
 * Generate topic performance analytics.
 * Calculates student accuracy per topic from exam attempts and quiz attempts.
 */
import { query, closePool } from '../src/common/database/index.js';

async function main() {
  console.log('=== Topic Performance Analytics ===\n');

  // Calculate performance per topic from exam and quiz attempts
  const performanceQuery = `
    SELECT 
      t.id AS topic_id,
      t.name AS topic_name,
      s.name AS subject_name,
      el.code AS level_code,
      COUNT(DISTINCT CASE WHEN qa.id IS NOT NULL OR ea.id IS NOT NULL THEN 
        CASE WHEN qa.student_id IS NOT NULL THEN qa.student_id ELSE ea.student_id END END) AS total_attempts,
      COUNT(CASE WHEN qa.id IS NOT NULL AND (
        (qa.answers::text LIKE '%"' || q.correct_answer::text || '"%') OR
        (q.correct_answer::text = 'T' AND qa.answers::text LIKE '%True%') OR
        (q.correct_answer::text = 'F' AND qa.answers::text LIKE '%False%')
      ) THEN 1 END) AS correct_answers,
      ROUND(AVG(CASE WHEN qa.percentage IS NOT NULL THEN qa.percentage ELSE NULL END), 1) AS avg_score
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id
    JOIN classes c ON c.id = t.class_id
    JOIN programs p ON p.id = c.program_id
    JOIN education_levels el ON el.id = p.education_level_id
    LEFT JOIN questions q ON q.topic_id = t.id AND q.is_active = TRUE
    LEFT JOIN quiz_questions qq ON qq.question_id = q.id
    LEFT JOIN quiz_attempts qa ON qa.question_id = q.id AND qa.student_id IS NOT NULL
    LEFT JOIN exam_questions eq ON eq.question_id = q.id
    LEFT JOIN exam_attempts ea ON ea.question_id = q.id AND ea.student_id IS NOT NULL
    WHERE t.is_active = TRUE
    GROUP BY t.id, t.name, s.name, el.code
    HAVING COUNT(CASE WHEN qa.id IS NOT NULL OR ea.id IS NOT NULL THEN 1 END) > 0
    ORDER BY avg_score ASC NULLS LAST
    LIMIT 50
  `;

  // Alternative simpler query
  const simpleQuery = `
    SELECT 
      t.name AS topic_name,
      s.name AS subject_name,
      el.code AS level_code,
      COUNT(DISTINCT q.id) AS total_questions,
      COUNT(DISTINCT CASE WHEN q.source = 'AI_GENERATED' OR q.source = 'SYSTEM_GENERATED' THEN q.id END) AS system_questions,
      COUNT(DISTINCT CASE WHEN q.source = 'PAST_QUESTION' THEN q.id END) AS past_questions
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id
    JOIN classes c ON c.id = t.class_id
    JOIN programs p ON p.id = c.program_id
    JOIN education_levels el ON el.id = p.education_level_id
    LEFT JOIN questions q ON q.topic_id = t.id
    GROUP BY t.name, s.name, el.code, el.order_index
    ORDER BY el.order_index, s.name, t.name
    LIMIT 100
  `;

  const result = await query(simpleQuery);
  
  console.log('Topic Question Distribution (first 20):');
  console.log('----------------------------------------');
  for (const row of result.rows.slice(0, 20)) {
    console.log(`  ${row.level_code} | ${row.subject_name.padEnd(25)} | ${row.topic_name.padEnd(30)} | ${row.total_questions} qs`);
  }

  // Generate performance summary by subject
  console.log('\n\nSubject Performance Summary:');
  console.log('-----------------------------');
  const subjectSummary = await query(`
    SELECT 
      s.name AS subject_name,
      el.code AS level_code,
      COUNT(DISTINCT t.id) AS topic_count,
      COUNT(DISTINCT q.id) AS question_count
    FROM subjects s
    JOIN topics t ON t.subject_id = s.id AND t.is_active = TRUE
    JOIN classes c ON c.id = t.class_id
    JOIN programs p ON p.id = c.program_id
    JOIN education_levels el ON el.id = p.education_level_id
    LEFT JOIN questions q ON q.topic_id = t.id
    GROUP BY s.name, el.code, el.order_index
    ORDER BY el.order_index, s.name
    LIMIT 30
  `);

  for (const row of subjectSummary.rows) {
    console.log(`  ${row.level_code} | ${row.subject_name.padEnd(30)} | ${row.topic_count} topics | ${row.question_count} questions`);
  }

  // Exam statistics
  console.log('\n\nExam Statistics:');
  console.log('----------------');
  const examStats = await query(`
    SELECT 
      exam_type,
      COUNT(*) as total_exams,
      SUM((SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = e.id)) as total_questions_in_exams
    FROM exams e
    GROUP BY exam_type
    ORDER BY total_exams DESC
  `);

  for (const row of examStats.rows) {
    console.log(`  ${row.exam_type}: ${row.total_exams} exams, ${row.total_questions_in_exams} questions`);
  }

  // Quiz statistics
  const quizStats = await query(`
    SELECT 
      COUNT(*) as total_quizzes,
      SUM((SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)) as total_quiz_questions
    FROM quizzes q
  `);
  console.log(`  Quizzes: ${quizStats.rows[0].total_quizzes} quizzes, ${quizStats.rows[0].total_quiz_questions} questions`);

  console.log('\n✅ Analytics generation complete');

  await closePool();
}

main().catch(err => {
  console.error('❌ Analytics failed:', err);
  closePool().finally(() => process.exit(1));
});
