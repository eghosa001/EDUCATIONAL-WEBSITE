/**
 * Seed wallets and teacher earnings for demo users.
 */
import { query, closePool } from '../src/common/database/index.js';

async function main() {
  console.log('=== Wallet & Earnings Seeder ===\n');

  // Get demo students and teachers
  const usersRes = await query(`
    SELECT u.id, u.first_name, u.last_name, r.name as role
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE u.email LIKE '%example.com'
    ORDER BY r.name, u.first_name
  `);

  const students = usersRes.rows.filter(u => u.role === 'student');
  const teachers = usersRes.rows.filter(u => u.role === 'teacher');

  console.log(`Found ${students.length} students, ${teachers.length} teachers\n`);

  // Create wallets for all users
  console.log('Creating wallets...');
  for (const user of [...students, ...teachers]) {
    await query(
      `INSERT INTO wallets (user_id, balance, currency)
       VALUES ($1, $2, 'NGN')
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()`,
      [user.id, user.role === 'teacher' ? 5000 : 0]
    );
    console.log(`  ✓ ${user.first_name} ${user.last_name} (${user.role}): ₦${user.role === 'teacher' ? '5,000' : '0'}`);
  }

  // Create subscription for one student (Premium)
  console.log('\nCreating subscriptions...');
  const [planRes, studentRes] = await Promise.all([
    query(`SELECT id FROM subscription_plans WHERE code = 'student_premium' LIMIT 1`),
    query(`SELECT id FROM users WHERE email = 'adebayo.j@example.com' LIMIT 1`),
  ]);

  if (planRes.rows[0] && studentRes.rows[0]) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await query(
      `INSERT INTO subscriptions (user_id, plan_id, gateway, status, current_period_start, current_period_end, started_at)
       VALUES ($1, $2, 'wallet', 'active', $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [studentRes.rows[0].id, planRes.rows[0].id, now, periodEnd, now]
    );
    console.log('  ✓ Student Premium subscription created');
  }

  // Create payments
  console.log('\nCreating sample payments...');
  const paymentData = [
    { userId: studentRes.rows[0]?.id, amount: 5000, purpose: 'subscription', gateway: 'wallet' },
    { userId: teachers[0]?.id, amount: 15000, purpose: 'course_upload', gateway: 'wallet' },
  ];

  for (const p of paymentData) {
    if (!p.userId) continue;
    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose, paid_at)
       VALUES ($1, $2, $3, 'NGN', $4, 'completed', $5, NOW())
       ON CONFLICT DO NOTHING`,
      [`DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, p.userId, p.amount, p.gateway, p.purpose]
    );
    console.log(`  ✓ Payment: ₦${p.amount.toLocaleString()} (${p.purpose})`);
  }

  // Create teacher earnings
  console.log('\nCreating teacher earnings...');
  const coursesRes = await query(`
    SELECT id, teacher_id FROM courses WHERE teacher_id IS NOT NULL LIMIT 5
  `);

  for (const teacher of teachers) {
    const earnings = [
      { amount: 12500, source: 'course_sales', description: 'Course: Mathematics JSS1' },
      { amount: 8000, source: 'lesson_views', description: 'Lesson views bonus' },
      { amount: 5000, source: 'subscription_share', description: 'Premium subscription revenue share' },
    ];

    for (const earning of earnings) {
      await query(
        `INSERT INTO teacher_earnings (teacher_id, course_id, amount, currency, source, description, status)
         VALUES ($1, NULL, $2, 'NGN', $3, $4, 'pending')
         ON CONFLICT DO NOTHING`,
        [teacher.id, earning.amount, earning.source, earning.description]
      );
    }
    console.log(`  ✓ ${teacher.first_name} ${teacher.last_name}: ₦${(12500 + 8000 + 5000).toLocaleString()} earnings`);
  }

  // Create wallet transactions
  console.log('\nCreating wallet transactions...');
  for (const student of students.slice(0, 2)) {
    const walletRes = await query(`SELECT id FROM wallets WHERE user_id = $1`, [student.id]);
    if (!walletRes.rows[0]) continue;

    await query(
      `INSERT INTO transactions (payment_id, wallet_id, user_id, type, amount, currency, balance_before, balance_after, reference, description)
       VALUES (NULL, $1, $2, 'credit', 1000, 'NGN', 0, 1000, 'DEMO-REF-${Date.now()}', 'Welcome bonus')
       ON CONFLICT DO NOTHING`,
      [walletRes.rows[0].id, student.id]
    );
    console.log(`  ✓ ${student.first_name} ${student.last_name}: ₦1,000 credit`);
  }

  // Verify
  console.log('\n✅ Wallet & Earnings seeding complete');
  const verify = await query(`
    SELECT 
      (SELECT COUNT(*) FROM wallets) as wallets,
      (SELECT COALESCE(SUM(balance), 0) FROM wallets) as total_balance,
      (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_payments,
      (SELECT COUNT(*) FROM teacher_earnings) as earnings_records,
      (SELECT COALESCE(SUM(amount), 0) FROM teacher_earnings) as total_earnings,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions
  `);
  console.log('\nVerification:');
  for (const row of verify.rows) {
    console.log(`   ${JSON.stringify(row)}`);
  }

  await closePool();
}

main().catch(err => {
  console.error('❌ Wallet seeding failed:', err);
  closePool().finally(() => process.exit(1));
});
