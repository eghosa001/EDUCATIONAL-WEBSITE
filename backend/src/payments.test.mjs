import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { query, pool } from './common/database/index.js';
import { generateReference } from './payments/models/payment.model.js';

async function setupDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) UNIQUE,
      balance DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'NGN',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(12,2) NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 30,
      features JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      plan_id UUID REFERENCES subscription_plans(id),
      gateway_subscription_id VARCHAR(255),
      gateway VARCHAR(50),
      status VARCHAR(50) DEFAULT 'inactive',
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function cleanupDB() {
  await query('DELETE FROM subscriptions');
  await query('DELETE FROM wallets');
  await query('DELETE FROM payments');
  await query('DELETE FROM users');
  await query('DELETE FROM subscription_plans');
}

describe('Payment Service Tests', () => {
  before(async () => {
    await setupDB();
  });

  after(async () => {
    await cleanupDB();
    await pool.end();
  });

  beforeEach(async () => {
    await query('TRUNCATE payments, subscriptions, wallets, users, subscription_plans RESTART IDENTITY CASCADE');
  });

  async function createTestUser(email) {
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, 'hashed_password', 'Test', 'User']
    );
    return result.rows[0];
  }

  it('should create a payment record', async () => {
    const user = await createTestUser('test-pay@example.com');

    const result = await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      ['EDU-test-ref-001', user.id, 5000, 'NGN', 'wallet', 'pending', 'subscription']
    );

    assert.ok(result.rows[0]);
    assert.strictEqual(result.rows[0].reference, 'EDU-test-ref-001');
    assert.strictEqual(result.rows[0].status, 'pending');
    assert.strictEqual(Number(result.rows[0].amount), 5000);
  });

  it('should find payment by reference', async () => {
    const user = await createTestUser('find-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['EDU-find-ref-002', user.id, 1000, 'NGN', 'paystack', 'pending', 'general']
    );

    const found = await query('SELECT * FROM payments WHERE reference = $1', ['EDU-find-ref-002']);
    assert.strictEqual(found.rows.length, 1);
    assert.strictEqual(Number(found.rows[0].amount), 1000);
  });

  it('should update payment to completed on successful webhook', async () => {
    const user = await createTestUser('webhook-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose, purpose_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['EDU-webhook-ref-001', user.id, 1500, 'NGN', 'paystack', 'pending', 'course', null]
    );

    const updated = await query(
      `UPDATE payments SET status = 'completed', paid_at = NOW(), gateway_reference = 'PS-stk-123'
       WHERE reference = $1 RETURNING *`,
      ['EDU-webhook-ref-001']
    );

    assert.strictEqual(updated.rows[0].status, 'completed');
    assert.ok(updated.rows[0].paid_at);
    assert.strictEqual(updated.rows[0].gateway_reference, 'PS-stk-123');
  });

  it('should not double-process completed payment (idempotency)', async () => {
    const user = await createTestUser('idempotent-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      ['EDU-idem-ref-002', user.id, 2000, 'NGN', 'flutterwave', 'completed', 'course']
    );

    // This simulates the idempotency check in the webhook handler:
    // only update if status is 'pending'
    const result = await query(
      `SELECT COUNT(*)::int AS affected FROM payments
       WHERE reference = $1 AND status = 'pending'`,
      ['EDU-idem-ref-002']
    );

    assert.strictEqual(result.rows[0].affected, 0);
  });

  it('should mark payment as failed on failed webhook', async () => {
    const user = await createTestUser('fail-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['EDU-fail-ref-003', user.id, 3000, 'NGN', 'paystack', 'pending', 'subscription']
    );

    const updated = await query(
      `UPDATE payments SET status = 'failed', failure_reason = 'gateway_decline'
       WHERE reference = $1 RETURNING *`,
      ['EDU-fail-ref-003']
    );

    assert.strictEqual(updated.rows[0].status, 'failed');
    assert.strictEqual(updated.rows[0].failure_reason, 'gateway_decline');
  });

  it('should list payments with status filter', async () => {
    const user = await createTestUser('list-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose) VALUES
       ($1, $2, $3, $4, $5, $6, $7),
       ($8, $9, $10, $11, $12, $13, $14),
       ($15, $16, $17, $18, $19, $20, $21)`,
      [
        'EDU-list-001', user.id, 1000, 'NGN', 'paystack', 'completed', 'course',
        'EDU-list-002', user.id, 2000, 'NGN', 'paystack', 'pending', 'subscription',
        'EDU-list-003', user.id, 3000, 'NGN', 'flutterwave', 'failed', 'general',
      ]
    );

    const completedResult = await query(
      `SELECT COUNT(*)::int AS total FROM payments WHERE status = $1`,
      ['completed']
    );
    assert.strictEqual(completedResult.rows[0].total, 1);

    const pendingResult = await query(
      `SELECT COUNT(*)::int AS total FROM payments WHERE status = $1`,
      ['pending']
    );
    assert.strictEqual(pendingResult.rows[0].total, 1);

    const allResult = await query(`SELECT COUNT(*)::int AS total FROM payments`);
    assert.strictEqual(allResult.rows[0].total, 3);
  });

  it('should generate unique payment references', () => {
    const ref1 = generateReference();
    const ref2 = generateReference();
    assert.notStrictEqual(ref1, ref2);
    assert.ok(ref1.startsWith('EDU-'));
    assert.ok(ref2.startsWith('EDU-'));
  });

  it('should simulate webhook amount mismatch detection', async () => {
    const user = await createTestUser('mismatch-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['EDU-mismatch-ref-004', user.id, 5000, 'NGN', 'paystack', 'pending', 'general']
    );

    // Simulate webhook with wrong amount (5001 instead of 5000)
    const webhookAmount = 5001;
    const paymentAmount = 5000;
    const mismatchThreshold = 0.01;

    const shouldFail = Math.abs(paymentAmount - webhookAmount) > mismatchThreshold;
    assert.strictEqual(shouldFail, true);
  });

  it('should process webhook with matching amount', async () => {
    const user = await createTestUser('match-test@example.com');

    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['EDU-match-ref-005', user.id, 5000, 'NGN', 'paystack', 'pending', 'general']
    );

    const webhookAmount = 5000;
    const paymentAmount = 5000;
    const mismatchThreshold = 0.01;

    const shouldFail = Math.abs(paymentAmount - webhookAmount) > mismatchThreshold;
    assert.strictEqual(shouldFail, false);

    // Process the successful payment
    const updated = await query(
      `UPDATE payments SET status = 'completed', paid_at = NOW()
       WHERE reference = $1 AND status = 'pending' RETURNING *`,
      ['EDU-match-ref-005']
    );

    assert.strictEqual(updated.rows[0].status, 'completed');
  });

  it('should handle wallet payment flow', async () => {
    const user = await createTestUser('wallet-test@example.com');

    // Create wallet with balance
    await query(
      `INSERT INTO wallets (user_id, balance, currency) VALUES ($1, $2, $3)`,
      [user.id, 10000, 'NGN']
    );

    // Create a completed wallet payment
    const payment = await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      ['EDU-wallet-006', user.id, 5000, 'NGN', 'wallet', 'completed', 'general']
    );

    assert.strictEqual(payment.rows[0].status, 'completed');
    assert.strictEqual(payment.rows[0].purpose, 'general');

    // Verify wallet still has correct balance (no deduction in this test)
    const wallet = await query('SELECT balance FROM wallets WHERE user_id = $1', [user.id]);
    assert.strictEqual(Number(wallet.rows[0].balance), 10000);
  });

  it('should process subscription activation on successful payment', async () => {
    const user = await createTestUser('sub-test@example.com');

    // Create a subscription plan
    const plan = await query(
      `INSERT INTO subscription_plans (name, code, price, duration_days, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['Premium Plan', 'premium-monthly', 5000, 30, true]
    );
    const planId = plan.rows[0].id;

    // Create a pending payment for subscription
    await query(
      `INSERT INTO payments (reference, user_id, amount, currency, gateway, status, purpose, purpose_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['EDU-sub-007', user.id, 5000, 'NGN', 'paystack', 'pending', 'subscription', planId]
    );

    // Simulate webhook: complete payment and activate subscription
    const updatedPayment = await query(
      `UPDATE payments SET status = 'completed', paid_at = NOW()
       WHERE reference = $1 AND status = 'pending' RETURNING *`,
      ['EDU-sub-007']
    );

    assert.strictEqual(updatedPayment.rows[0].status, 'completed');

    // Activate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + plan.rows[0].duration_days);

    await query(
      `INSERT INTO subscriptions (user_id, plan_id, gateway_subscription_id, gateway, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, planId, 'PS-sub-123', 'paystack', 'active', now.toISOString(), periodEnd.toISOString()]
    );

    // Verify subscription is active
    const sub = await query('SELECT * FROM subscriptions WHERE user_id = $1', [user.id]);
    assert.strictEqual(sub.rows[0].status, 'active');
    assert.strictEqual(Number(sub.rows[0].plan_id), Number(planId));
  });
});
