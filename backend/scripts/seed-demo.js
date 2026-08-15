/**
 * Seed demo users, enrollments, and progress data.
 */
import { query, closePool } from '../src/common/database/index.js';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = await bcrypt.hash('Demo1234!', 10);

async function getRoleId(name) {
  const r = await query('SELECT id FROM roles WHERE name = $1', [name]);
  return r.rows[0]?.id;
}

async function createUser(firstName, lastName, email, roleName) {
  const roleId = await getRoleId(roleName);
  if (!roleId) throw new Error(`Role "${roleName}" not found`);

  // Check if user exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    return { id: existing.rows[0].id, first_name: firstName, last_name: lastName, email };
  }

  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, is_active, is_verified)
     VALUES ($1, $2, $3, $4, TRUE, TRUE)
     RETURNING id, first_name, last_name, email`,
    [firstName, lastName, email, DEMO_PASSWORD]
  );
  const userId = result.rows[0].id;

  await query(
    `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, roleId]
  );

  return result.rows[0];
}

async function main() {
  console.log('=== Demo Data Seeder ===\n');

  console.log('Creating users...');
  const students = [];
  const teachers = [];

  const studentData = [
    ['Adebayo', 'Johnson', 'adebayo.j@example.com'],
    ['Chidinma', 'Okafor', 'chidinma.o@example.com'],
    ['Emeka', 'Nwosu', 'emeka.n@example.com'],
    ['Fatima', 'Abubakar', 'fatima.a@example.com'],
    ['Gbenga', 'Tatoye', 'gbenga.t@example.com'],
  ];

  for (const [first, last, email] of studentData) {
    const user = await createUser(first, last, email, 'student');
    students.push(user);
    console.log(`  ✓ Student: ${user.first_name} ${user.last_name}`);
  }

  const teacherData = [
    ['Dr.', 'Adeyemi', 'adeyemi.t@example.com'],
    ['Mrs.', 'Balogun', 'balogun.t@example.com'],
    ['Engr.', 'Chukwu', 'chukwu.t@example.com'],
  ];

  for (const [title, last, email] of teacherData) {
    const user = await createUser(title, last, email, 'teacher');
    teachers.push(user);
    console.log(`  ✓ Teacher: ${user.first_name} ${user.last_name}`);
  }

  console.log('\nFetching courses...');
  const coursesRes = await query(
    `SELECT c.id, c.title, c.subject_id, s.name AS subject_name, el.code AS level_code
     FROM courses c
     JOIN subjects s ON s.id = c.subject_id
     JOIN classes cl ON cl.id = c.class_id
     JOIN programs p ON p.id = cl.program_id
     JOIN education_levels el ON el.id = p.education_level_id
     WHERE c.status = 'published' AND c.is_free = TRUE
     ORDER BY el.order_index, s.name
     LIMIT 30`
  );
  console.log(`  Found ${coursesRes.rows.length} published courses`);

  console.log('\nEnrolling students...');
  let enrollments = 0;
  let progressRecords = 0;

  for (const student of students) {
    const numCourses = 2 + Math.floor(Math.random() * 3);
    const shuffled = coursesRes.rows.sort(() => Math.random() - 0.5).slice(0, numCourses);

    for (const course of shuffled) {
      await query(
        `INSERT INTO student_courses (student_id, course_id, progress_percentage, enrolled_at)
         VALUES ($1, $2, 0, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
         ON CONFLICT (student_id, course_id) DO NOTHING`,
        [student.id, course.id]
      );
      enrollments++;

      const lessonsRes = await query(
        `SELECT id FROM lessons WHERE course_id = $1 ORDER BY order_index LIMIT 5`,
        [course.id]
      );

      for (let i = 0; i < lessonsRes.rows.length; i++) {
        const completed = i < lessonsRes.rows.length - 1;
        await query(
          `INSERT INTO lesson_progress (student_id, lesson_id, course_id, status, progress_percentage, completed_at)
           VALUES ($1, $2, $3, $4, $5, ${completed ? `NOW() - INTERVAL '${Math.floor(Math.random() * 14)} days'` : 'NULL'})
           ON CONFLICT (student_id, lesson_id) DO NOTHING`,
          [student.id, lessonsRes.rows[i].id, course.id, completed ? 'completed' : 'in_progress', completed ? 100 : Math.floor(Math.random() * 80) + 10]
        );
        progressRecords++;
      }
    }
  }

  console.log('\nCreating quiz attempts...');
  const quizzesRes = await query(`SELECT id, course_id FROM quizzes LIMIT 10`);
  let attempts = 0;

  for (const quiz of quizzesRes.rows) {
    for (const student of students.slice(0, 3)) {
      const score = 50 + Math.floor(Math.random() * 50);
      await query(
        `INSERT INTO quiz_attempts (quiz_id, student_id, score, total_questions, completed_at)
         VALUES ($1, $2, $3, 10, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
         ON CONFLICT DO NOTHING`,
        [quiz.id, student.id, score]
      );
      attempts++;
    }
  }

  console.log(`\n✅ Demo data seeding complete:`);
  console.log(`   Students:     ${students.length}`);
  console.log(`   Teachers:     ${teachers.length}`);
  console.log(`   Courses:      ${coursesRes.rows.length}`);
  console.log(`   Enrollments:  ${enrollments}`);
  console.log(`   Progress:     ${progressRecords}`);
  console.log(`   Quiz attempts: ${attempts}`);

  const verify = await query(`
    SELECT
      (SELECT COUNT(*) FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE ur.role_id IN (SELECT id FROM roles WHERE name = 'student')) as students,
      (SELECT COUNT(*) FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE ur.role_id IN (SELECT id FROM roles WHERE name = 'teacher')) as teachers,
      (SELECT COUNT(*) FROM student_courses) as enrollments,
      (SELECT COUNT(*) FROM lesson_progress) as progress
  `);
  console.log('\nVerification:');
  for (const row of verify.rows) {
    console.log(`   ${JSON.stringify(row)}`);
  }

  await closePool();
}

main().catch(err => {
  console.error('❌ Demo seeding failed:', err);
  closePool().finally(() => process.exit(1));
});
