/**
 * Seed demo users, enrollments, progress, quiz attempts via Supabase.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, KEY);

async function main() {
  console.log('=== Demo Data Seeder (Supabase) ===\n');

  // Get/create roles
  const { data: roles } = await sb.from('roles').select('id,name').in('name', ['student','teacher']);
  const roleById = {}; for (const r of roles||[]) roleById[r.name] = r.id;
  console.log('Roles:', roles?.map(r => `${r.name}(${r.id.slice(0,8)})`).join(', '));

  // Create demo users if they don't exist
  const DEMO_USERS = [
    { first:'Adebayo', last:'Johnson', email:'adebayo.j@example.com', role:'student' },
    { first:'Chidinma', last:'Okafor', email:'chidinma.o@example.com', role:'student' },
    { first:'Emeka', last:'Nwosu', email:'emeka.n@example.com', role:'student' },
    { first:'Fatima', last:'Abubakar', email:'fatima.a@example.com', role:'student' },
    { first:'Gbenga', last:'Tatoye', email:'gbenga.t@example.com', role:'student' },
    { first:'Dr.', last:'Adeyemi', email:'adeyemi.t@example.com', role:'teacher' },
    { first:'Mrs.', last:'Balogun', email:'balogun.t@example.com', role:'teacher' },
    { first:'Engr.', last:'Chukwu', email:'chukwu.t@example.com', role:'teacher' },
  ];

  const students = [];
  const teachers = [];

  for (const u of DEMO_USERS) {
    // Check existing
    const { data: existing } = await sb.from('users').select('id').eq('email', u.email).limit(1);
    let userId;
    if (existing?.[0]) {
      userId = existing[0].id;
    } else {
      // Create user (password hash is just a placeholder — login via admin)
      const { data: newUser } = await sb.from('users').insert({
        first_name: u.first, last_name: u.last, email: u.email,
        password_hash: '$2a$10$dummyhashfordemoonlynotused',
        is_active: true, is_verified: true,
      }).select('id').single();
      userId = newUser?.id;
    }
    // Assign role
    const roleId = roleById[u.role];
    if (roleId) {
      await sb.from('user_roles').insert({ user_id: userId, role_id: roleId }).select().single().then(() => {}).catch(()=>{});
    }
    if (u.role === 'student') students.push({ id: userId, ...u });
    else teachers.push({ id: userId, ...u });
  }

  console.log(`\nUsers: ${students.length} students, ${teachers.length} teachers`);

  // Get courses
  const { data: courses } = await sb.from('courses').select('id,title,subject_id').eq('status','published').limit(30);
  console.log(`Published courses: ${courses?.length || 0}`);

  // Enroll students in random courses
  console.log('\nEnrolling students...');
  let enrollments = 0;
  let progressRecords = 0;
  for (const student of students) {
    const numCourses = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...(courses||[])].sort(() => Math.random() - 0.5).slice(0, numCourses);
    for (const course of shuffled) {
      const { error: enrollErr } = await sb.from('student_courses').insert({
        student_id: student.id, course_id: course.id,
        progress_percentage: 0,
        enrolled_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      });
      if (!enrollErr) enrollments++;
    }
  }
  console.log(`  Enrollments: ${enrollments}`);

  // Create lesson progress
  console.log('\nCreating lesson progress...');
  for (const student of students) {
    const { data: enrolled } = await sb.from('student_courses').select('course_id').eq('student_id', student.id);
    for (const enc of enrolled||[]) {
      const { data: lessons } = await sb.from('lessons').select('id').eq('course_id', enc.course_id).eq('is_published', true).order('order_index').limit(5);
      for (let i = 0; i < (lessons?.length||0); i++) {
        const completed = i < (lessons?.length||0) - 1;
        const { error: progErr } = await sb.from('lesson_progress').insert({
          student_id: student.id,
          lesson_id: lessons[i].id,
          course_id: enc.course_id,
          status: completed ? 'completed' : 'in_progress',
          progress_percentage: completed ? 100 : Math.floor(Math.random() * 70) + 10,
          completed_at: completed ? new Date(Date.now() - Math.random() * 14 * 86400000).toISOString() : null,
        });
        if (!progErr) progressRecords++;
      }
    }
  }
  console.log(`  Progress records: ${progressRecords}`);

  // Create quiz attempts
  console.log('\nCreating quiz attempts...');
  const { data: quizzes } = await sb.from('quizzes').select('id').limit(10);
  let attempts = 0;
  for (const quiz of quizzes||[]) {
    for (const student of students.slice(0,3)) {
      const score = 50 + Math.floor(Math.random() * 50);
      const { error: attErr } = await sb.from('quiz_attempts').insert({
        quiz_id: quiz.id, student_id: student.id,
        attempt_number: 1, status: 'completed',
        score: score, percentage: score,
        is_passed: score >= 50,
        started_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        submitted_at: new Date().toISOString(),
      });
      if (!attErr) attempts++;
    }
  }
  console.log(`  Quiz attempts: ${attempts}`);

  // Study sessions
  console.log('\nCreating study sessions...');
  let sessions = 0;
  for (const student of students) {
    for (let i = 0; i < 3; i++) {
      const { error: sessErr } = await sb.from('study_sessions').insert({
        student_id: student.id,
        started_at: new Date(Date.now() - (i+1) * 3600000).toISOString(),
        ended_at: new Date(Date.now() - (i+1) * 3600000 + 1800000).toISOString(),
        duration_seconds: 1800 + Math.floor(Math.random() * 1800),
        activity_type: 'lesson',
      });
      if (!sessErr) sessions++;
    }
  }
  console.log(`  Study sessions: ${sessions}`);

  // AI usage
  console.log('\nCreating AI usage records...');
  for (const student of students) {
    const { error: aiErr } = await sb.from('ai_usage').insert({
      user_id: student.id,
      date: new Date().toISOString().split('T')[0],
      questions_asked: 3 + Math.floor(Math.random() * 7),
      tokens_used: 500 + Math.floor(Math.random() * 2000),
      conversations_started: 1,
    });
    if (!aiErr) {}
  }
  console.log('  Done');

  // Verify
  console.log('\n═══ VERIFICATION ═══');
  for (const tbl of ['users','student_courses','lesson_progress','quiz_attempts','study_sessions','ai_usage']) {
    const { count } = await sb.from(tbl).select('*', { count:'exact', head:true });
    console.log(`  ${tbl}: ${(count??0).toLocaleString()}`);
  }
  console.log('\n✅ Demo data seeded! Refresh your browser.');
}

main().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
