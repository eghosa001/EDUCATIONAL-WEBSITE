/**
 * Seed ecosystem data: parents, schools, community, gamification.
 */
import { query, closePool } from '../src/common/database/index.js';

async function main() {
  console.log('=== Ecosystem Seeder ===\n');

  // Get demo students
  const studentsRes = await query(`
    SELECT u.id, u.first_name, u.last_name 
    FROM users u JOIN user_roles ur ON ur.user_id = u.id 
    JOIN roles r ON r.id = ur.role_id WHERE r.name = 'student'
  `);

  console.log(`Found ${studentsRes.rows.length} students\n`);

  // Create parent accounts
  console.log('Creating parents...');
  const parentIds = [];
  const parentData = [
    ['Mr.', 'Johnson', 'mr.johnson@example.com', 'father'],
    ['Mrs.', 'Okafor', 'mrs.okafor@example.com', 'mother'],
    ['Dr.', 'Abubakar', 'dr.abubakar@example.com', 'guardian'],
  ];

  for (const [title, lastName, email, relationship] of parentData) {
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      const userId = existing.rows[0].id;
      const parentRes = await query('SELECT id FROM parents WHERE user_id = $1', [userId]);
      if (!parentRes.rows[0]) {
        const p = await query(`INSERT INTO parents (user_id, occupation, phone) VALUES ($1, 'Parent', '080-000-0000') RETURNING id`, [userId]);
        parentIds.push(p.rows[0].id);
      }
      console.log(`  ✓ Parent (existing): ${title} ${lastName}`);
      continue;
    }

    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, is_active, is_verified)
       VALUES ($1, $2, $3, $4, TRUE, TRUE)
       RETURNING id, first_name, last_name`,
      [title, lastName, email, '$2a$10$dummy']
    );
    
    await query(
      `INSERT INTO user_roles (user_id, role_id) 
       VALUES ($1, (SELECT id FROM roles WHERE name = 'parent'))
       ON CONFLICT DO NOTHING`,
      [result.rows[0].id]
    );

    // Create parent profile
    const parentResult = await query(
      `INSERT INTO parents (user_id, occupation, phone)
       VALUES ($1, 'Parent', '080-000-0000')
       RETURNING id`,
      [result.rows[0].id]
    );
    parentIds.push(parentResult.rows[0].id);
    console.log(`  ✓ Parent: ${result.rows[0].first_name} ${result.rows[0].last_name}`);
  }

  // Link parents to children
  console.log('\nLinking parents to children...');
  for (let i = 0; i < Math.min(studentsRes.rows.length, parentIds.length); i++) {
    await query(
      `INSERT INTO parent_children (parent_id, child_user_id, relationship, notifications_enabled)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING`,
      [parentIds[i], studentsRes.rows[i].id, i === 0 ? 'father' : i === 1 ? 'mother' : 'guardian']
    );
    console.log(`  ✓ ${studentsRes.rows[i].first_name} linked to parent`);
  }

  // Create schools
  console.log('\nCreating schools...');
  const schoolData = [
    { name: 'Federal Government College', code: 'FGC-ABJ', type: 'Government', state: 'FCT', lga: 'Garki', students: 1250, teachers: 45 },
    { name: 'Grace International School', code: 'GIS-LAG', type: 'Private', state: 'Lagos', lga: 'Ikeja', students: 890, teachers: 32 },
    { name: 'Queen\'s Secondary School', code: 'QSS-PH', type: 'Missionary', state: 'Rivers', lga: 'Port Harcourt', students: 670, teachers: 28 },
  ];

  for (const school of schoolData) {
    await query(
      `INSERT INTO schools (name, code, email, phone, state, lga, type, max_students, status, subscription_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 'free')
       ON CONFLICT (code) DO UPDATE SET name = $1`,
      [
        school.name, school.code, 
        `admin@${school.code.toLowerCase()}.ng`, 
        `080-${Math.floor(Math.random()*9000000)+1000000}`,
        school.state, school.lga, school.type, school.students
      ]
    );
    console.log(`  ✓ ${school.name}`);
  }

  // Create community forums and posts
  console.log('\nCreating community content...');
  
  // Get some student/teacher IDs
  const userIdsRes = await query(`
    SELECT u.id, u.first_name, u.last_name, r.name as role
    FROM users u JOIN user_roles ur ON ur.user_id = u.id 
    JOIN roles r ON r.id = ur.role_id WHERE r.name IN ('student', 'teacher')
    LIMIT 10
  `);

  const STUDENT_IDS = userIdsRes.rows.filter(u => u.role === 'student').map(u => u.id);
  const TEACHER_IDS = userIdsRes.rows.filter(u => u.role === 'teacher').map(u => u.id);

  const FORUMS = [
    { name: 'General Discussion', description: 'General academic discussions', type: 'discussion' },
    { name: 'Mathematics Help', description: 'Get help with math problems', type: 'subject' },
    { name: 'Science Club', description: 'Biology, Chemistry, Physics discussions', type: 'subject' },
    { name: 'Exam Preparation', description: 'WAEC, NECO, JAMB prep', type: 'exam' },
  ];

  const posts = [
    { type: 'discussion', title: 'How to prepare for WAEC Mathematics?', content: 'I have WAEC coming up and I\'m struggling with algebra. Any tips from senior students?', subject: 'MATHEMATICS' },
    { type: 'discussion', title: 'Best resources for JAMB preparation?', content: 'Looking for recommended textbooks and past questions for JAMB 2024.', subject: 'GENERAL' },
    { type: 'exam', title: 'NECO Biology practical tips', content: 'Share your practical exam experiences and tips for success.', subject: 'BIOLOGY' },
    { type: 'discussion', title: 'Understanding Photosynthesis', content: 'Can someone explain the light-dependent and light-independent reactions?', subject: 'BIOLOGY' },
    { type: 'subject', title: 'Chemistry: Organic compounds made easy', content: 'Let\'s discuss the different classes of organic compounds with examples.', subject: 'CHEMISTRY' },
    { type: 'discussion', title: 'Study group for Physics', content: 'Who wants to form a study group for SS3 Physics?', subject: 'PHYSICS' },
    { type: 'exam', title: 'JAMB English tips and tricks', content: 'Share your strategies for tackling the JAMB English section.', subject: 'ENGLISH LANGUAGE' },
    { type: 'discussion', title: 'How to improve Essay writing', content: 'Looking for tips to improve my essay writing skills for exams.', subject: 'ENGLISH LANGUAGE' },
  ];

  for (const forum of FORUMS) {
    await query(
      `INSERT INTO forums (name, description, type, is_active)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT DO NOTHING`,
      [forum.name, forum.forum?.description || forum.name, forum.type]
    );
  }

  const forumsRes = await query('SELECT id, name FROM forums WHERE is_active = TRUE');
  const forumMap = {};
  for (const f of forumsRes.rows) {
    forumMap[f.name] = f.id;
  }

  for (const post of posts) {
    const subjectRes = await query(`SELECT id FROM subjects WHERE name = $1 LIMIT 1`, [post.subject]);
    const subjectId = subjectRes.rows[0]?.id;
    const forumId = Object.keys(forumMap).find(k => post.type === 'exam' && k.includes('Exam') || 
                                                       post.type === 'subject' && k.includes(post.subject) ||
                                                       forumMap[k]) || forumsRes.rows[0]?.id;
    const authorId = Math.random() > 0.5 ? (TEACHER_IDS[0] || STUDENT_IDS[0]) : STUDENT_IDS[0];
    
    await query(
      `INSERT INTO community_posts (user_id, type, title, content, subject_id, forum_id, status, likes_count, replies_count)
       VALUES ($1, $2, $3, $4, $5, $6, 'published', 0, 0)
       ON CONFLICT DO NOTHING`,
      [authorId, post.type, post.title, post.content, subjectId, forumId]
    );
  }
  console.log(`  ✓ Created ${posts.length} community posts`);

  // Create comments
  console.log('\nCreating comments...');
  const comments = await query(`
    SELECT id, user_id FROM community_posts LIMIT 5
  `);
  for (const post of comments.rows) {
    for (let i = 0; i < 3; i++) {
      await query(
        `INSERT INTO comments (post_id, user_id, content, status)
         VALUES ($1, $2, $3, 'approved')
         ON CONFLICT DO NOTHING`,
        [post.id, STUDENT_IDS[i % STUDENT_IDS.length] || STUDENT_IDS[0], 
         `Great post! This really helped me understand the topic better.`]
      );
    }
  }

  // Gamification: Create badges and award to students
  console.log('\nCreating gamification data...');
  const BADGES = [
    { name: 'First Login', description: 'Created your account', xp: 10, icon: '🎯' },
    { name: 'First Lesson', description: 'Started your first lesson', xp: 50, icon: '📚' },
    { name: 'Week Streak', description: 'Studied 7 days in a row', xp: 200, icon: '🔥' },
    { name: 'Quiz Master', description: 'Completed 10 quizzes', xp: 300, icon: '🏆' },
    { name: 'Exam Champion', description: 'Passed an exam with 80%+', xp: 500, icon: '⭐' },
    { name: 'Top Scorer', description: 'Ranked #1 in a subject', xp: 750, icon: '👑' },
  ];

  for (const badge of BADGES) {
    await query(
      `INSERT INTO badges (name, code, description, icon_url, xp_reward, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (code) DO NOTHING`,
      [badge.name, badge.name.toLowerCase().replace(/\s+/g, '_'), badge.description, badge.icon, badge.xp]
    );
  }

  // Award badges to students
  const badgesRes = await query('SELECT id, xp_reward FROM badges WHERE is_active = TRUE ORDER BY xp_reward');
  for (const student of studentsRes.rows) {
    const studentBadges = badgesRes.rows.slice(0, 2 + Math.floor(Math.random() * 3));
    for (const badge of studentBadges) {
      await query(
        `INSERT INTO achievements (user_id, badge_id, earned_at)
         VALUES ($1, $2, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
         ON CONFLICT DO NOTHING`,
        [student.id, badge.id]
      );
    }
    
    // Update XP
    const totalXP = studentBadges.reduce((sum, b) => sum + b.xp_reward, 0);
    await query(
      `INSERT INTO student_points (user_id, total_points, current_streak, longest_streak, level, xp_to_next_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET total_points = EXCLUDED.total_points`,
      [student.id, totalXP, 3 + Math.floor(Math.random() * 5), 7 + Math.floor(Math.random() * 5), Math.floor(totalXP / 100) + 1, 100]
    );
  }

  // Verify
  console.log('\n✅ Ecosystem seeding complete');
  const verify = await Promise.all([
    query('SELECT COUNT(*)::int as cnt FROM schools'),
    query('SELECT COUNT(*)::int as cnt FROM parent_children'),
    query('SELECT COUNT(*)::int as cnt FROM community_posts'),
    query('SELECT COUNT(*)::int as cnt FROM comments'),
    query('SELECT COUNT(*)::int as cnt FROM badges'),
    query('SELECT COUNT(*)::int as cnt FROM student_badges'),
  ]);

  console.log('\nVerification:');
  console.log(`   Schools: ${verify[0].rows[0].cnt}`);
  console.log(`   Parent-Child links: ${verify[1].rows[0].cnt}`);
  console.log(`   Community posts: ${verify[2].rows[0].cnt}`);
  console.log(`   Comments: ${verify[3].rows[0].cnt}`);
  console.log(`   Badges: ${verify[4].rows[0].cnt}`);
  console.log(`   Student badges: ${verify[5].rows[0].cnt}`);

  await closePool();
}

main().catch(err => {
  console.error('❌ Ecosystem seeding failed:', err);
  closePool().finally(() => process.exit(1));
});
