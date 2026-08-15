/**
 * Seed Phase 7 data: study sessions, AI usage, flashcards, live classes, assignments.
 */
import { query, closePool } from '../src/common/database/index.js';

async function main() {
  console.log('=== Phase 7: Scale Seeder ===\n');

  // Get users
  const studentsRes = await query(`
    SELECT u.id FROM users u 
    JOIN user_roles ur ON ur.user_id = u.id 
    JOIN roles r ON r.id = ur.role_id 
    WHERE r.name = 'student'
  `);
  const teachersRes = await query(`
    SELECT u.id FROM users u 
    JOIN user_roles ur ON ur.user_id = u.id 
    JOIN roles r ON r.id = ur.role_id 
    WHERE r.name = 'teacher'
  `);

  const students = studentsRes.rows;
  const teachers = teachersRes.rows;

  console.log(`Found ${students.length} students, ${teachers.length} teachers\n`);

  // Seed study sessions
  console.log('Seeding study sessions...');
  for (const student of students) {
    for (let i = 0; i < 5; i++) {
      await query(
        `INSERT INTO study_sessions (student_id, course_id, lesson_id, started_at, ended_at, duration_seconds)
         VALUES ($1, NULL, NULL, NOW() - INTERVAL '${i + 1} hours', NOW() - INTERVAL '${i + 0.5} hours', $2)
         ON CONFLICT DO NOTHING`,
        [student.id, 1800 + Math.floor(Math.random() * 2400)]
      );
    }
  }
  console.log(`  ✓ ${students.length * 5} study sessions`);

  // Seed AI usage
  console.log('\nSeeding AI usage...');
  for (const student of students) {
    await query(
      `INSERT INTO ai_usage (user_id, date, questions_asked, tokens_used, conversations_started)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET
         questions_asked = ai_usage.questions_asked + EXCLUDED.questions_asked,
         tokens_used = ai_usage.tokens_used + EXCLUDED.tokens_used
      `,
      [student.id, 3 + Math.floor(Math.random() * 10), 500 + Math.floor(Math.random() * 2000), 1]
    );
  }
  console.log(`  ✓ ${students.length} AI usage records`);

  // Seed flashcards
  console.log('\nSeeding flashcards...');
  const subjectsRes = await query(`SELECT id, name FROM subjects LIMIT 10`);
  let flashcardCount = 0;
  for (const subject of subjectsRes.rows) {
    for (let i = 0; i < 5; i++) {
      await query(
        `INSERT INTO flashcards (course_id, subject_id, front, back, is_reviewed)
         VALUES (NULL, $1, $2, $3, FALSE)
         ON CONFLICT DO NOTHING`,
        [subject.id, `What is ${subject.name}?`, `Key concepts of ${subject.name} for Nigerian curriculum`]
      );
      flashcardCount++;
    }
  }
  console.log(`  ✓ ${flashcardCount} flashcards`);

  // Seed flashcard reviews
  console.log('\nSeeding flashcard reviews...');
  const flashcardsRes = await query(`SELECT id FROM flashcards LIMIT 20`);
  for (const fc of flashcardsRes.rows) {
    await query(
      `INSERT INTO flashcard_reviews (flashcard_id, user_id, ease_factor, interval_days, review_count, next_review)
       VALUES ($1, $2, 2.5, 3, 1, NOW() + INTERVAL '3 days')
       ON CONFLICT DO NOTHING`,
      [fc.id, students[0]?.id]
    );
  }
  console.log(`  ✓ ${flashcardsRes.rows.length} flashcard reviews`);

  // Seed live classes
  console.log('\nSeeding live classes...');
  for (let i = 0; i < 3; i++) {
    await query(
      `INSERT INTO live_classes (course_id, teacher_id, title, description, scheduled_at, duration_minutes, is_active, status)
       VALUES (NULL, $1, $2, $3, NOW() + INTERVAL '${i + 1} days', $4, TRUE, 'scheduled')
       ON CONFLICT DO NOTHING`,
      [teachers[i % teachers.length]?.id, `Live Math Class ${i + 1}`, `Interactive mathematics session`, 60]
    );
  }
  console.log('  ✓ 3 live classes');

  // Seed assignments
  console.log('\nSeeding assignments...');
  const assignments = [
    { title: 'Algebra Worksheet', description: 'Complete exercises 1-20 on page 45', subject: 'MATHEMATICS' },
    { title: 'Essay: My Future', description: 'Write a 500-word essay about your career goals', subject: 'ENGLISH LANGUAGE' },
    { title: 'Biology Lab Report', description: 'Document your cell observation experiment', subject: 'BIOLOGY' },
    { title: 'Physics Problem Set', description: 'Solve mechanics problems 1-15', subject: 'PHYSICS' },
  ];

  for (const assign of assignments) {
    const subjectRes = await query(`SELECT id FROM subjects WHERE name = $1 LIMIT 1`, [assign.subject]);
    await query(
      `INSERT INTO assignments (course_id, teacher_id, title, description, subject_id, due_date, max_marks, status)
       VALUES (NULL, $1, $2, $3, $4, NOW() + INTERVAL '7 days', 100, 'active')
       ON CONFLICT DO NOTHING`,
      [teachers[0]?.id, assign.title, assign.description, subjectRes.rows[0]?.id]
    );
  }
  console.log(`  ✓ ${assignments.length} assignments`);

  // Seed submissions
  console.log('\nSeeding submissions...');
  const assignmentsRes = await query(`SELECT id FROM assignments WHERE status = 'active' LIMIT 3`);
  for (const assign of assignmentsRes.rows) {
    for (let i = 0; i < 3; i++) {
      await query(
        `INSERT INTO submissions (assignment_id, student_id, content, status, score, submitted_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${i + 1} days')
         ON CONFLICT DO NOTHING`,
        [assign.id, students[i]?.id, `Sample submission for ${assign.id}`, 'graded', 75 + Math.floor(Math.random() * 25)]
      );
    }
  }
  console.log(`  ✓ ${assignmentsRes.rows.length * 3} submissions`);

  // Seed course sections and update course stats
  console.log('\nUpdating course statistics...');
  const coursesRes = await query(`SELECT id FROM courses LIMIT 10`);
  for (const course of coursesRes.rows) {
    // Add sections
    for (let i = 1; i <= 3; i++) {
      await query(
        `INSERT INTO course_sections (course_id, title, description, order_index)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [course.id, `Section ${i}: Introduction`, `Learn the basics of ${course.title}`, i]
      );
    }
  }

  // Verify
  console.log('\n✅ Phase 7 seeding complete');
  const verify = await Promise.all([
    query('SELECT COUNT(*)::int as cnt FROM study_sessions'),
    query('SELECT COUNT(*)::int as cnt FROM ai_usage'),
    query('SELECT COUNT(*)::int as cnt FROM flashcards'),
    query('SELECT COUNT(*)::int as cnt FROM flashcard_reviews'),
    query('SELECT COUNT(*)::int as cnt FROM live_classes'),
    query('SELECT COUNT(*)::int as cnt FROM assignments'),
    query('SELECT COUNT(*)::int as cnt FROM submissions'),
  ]);

  console.log('\nVerification:');
  console.log(`   Study sessions: ${verify[0].rows[0].cnt}`);
  console.log(`   AI usage: ${verify[1].rows[0].cnt}`);
  console.log(`   Flashcards: ${verify[2].rows[0].cnt}`);
  console.log(`   Flashcard reviews: ${verify[3].rows[0].cnt}`);
  console.log(`   Live classes: ${verify[4].rows[0].cnt}`);
  console.log(`   Assignments: ${verify[5].rows[0].cnt}`);
  console.log(`   Submissions: ${verify[6].rows[0].cnt}`);

  await closePool();
}

main().catch(err => {
  console.error('❌ Phase 7 seeding failed:', err);
  closePool().finally(() => process.exit(1));
});
