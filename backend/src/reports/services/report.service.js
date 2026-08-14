import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const buildUserConditions = (filters = {}) => {
  const conditions = [];
  const values = [];
  if (filters.role) {
    conditions.push(`r.name = $${values.length + 1}`);
    values.push(filters.role);
  }
  if (filters.from) {
    conditions.push(`u.created_at >= $${values.length + 1}`);
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`u.created_at <= $${values.length + 1}`);
    values.push(filters.to);
  }
  return { clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', values };
};

const buildDateConditions = (filters = {}, column = 'created_at') => {
  const conditions = [];
  const values = [];
  if (filters.from) {
    conditions.push(`${column} >= $${values.length + 1}`);
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`${column} <= $${values.length + 1}`);
    values.push(filters.to);
  }
  return { clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', values };
};

const buildExamConditions = (filters = {}) => {
  const conditions = ["ea.status = 'submitted'"];
  const values = [];
  if (filters.examId) {
    conditions.push(`ea.exam_id = $${values.length + 1}`);
    values.push(filters.examId);
  }
  if (filters.from) {
    conditions.push(`ea.submitted_at >= $${values.length + 1}`);
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`ea.submitted_at <= $${values.length + 1}`);
    values.push(filters.to);
  }
  return { clause: `WHERE ${conditions.join(' AND ')}`, values };
};

const generateUserSummary = async (filters = {}) => {
  const { clause, values } = buildUserConditions(filters);
  const [countsResult, rolesResult] = await Promise.all([
    query(
      `SELECT
         COUNT(DISTINCT u.id)::int AS total_users,
         COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = TRUE)::int AS active_users,
         COUNT(DISTINCT u.id) FILTER (WHERE u.is_verified = TRUE)::int AS verified_users
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${clause}`,
      values
    ),
    query(
      `SELECT COALESCE(r.name, 'unassigned') AS role, COUNT(DISTINCT u.id)::int AS count
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${clause}
       GROUP BY r.name
       ORDER BY count DESC`,
      values
    ),
  ]);

  const counts = countsResult.rows[0] || {};
  return {
    totalUsers: parseInt(counts.total_users || 0),
    activeUsers: parseInt(counts.active_users || 0),
    verifiedUsers: parseInt(counts.verified_users || 0),
    byRole: rolesResult.rows.map((row) => ({
      role: row.role,
      count: parseInt(row.count),
    })),
  };
};

const generateRevenueSummary = async (filters = {}) => {
  const { clause, values } = buildDateConditions(filters, 'created_at');
  const statusClause = clause
    ? `WHERE status = 'completed' AND ${clause.slice(6)}`
    : `WHERE status = 'completed'`;
  const [byMonthResult, totalResult] = await Promise.all([
    query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
         COUNT(*)::int AS transaction_count,
         COALESCE(SUM(amount), 0)::numeric(14,2) AS total_amount
       FROM payments
       ${statusClause}
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month DESC
       LIMIT 12`,
      values
    ),
    query(
      `SELECT
         COALESCE(SUM(amount), 0)::numeric(14,2) AS total,
         COUNT(*)::int AS transaction_count
       FROM payments
       ${statusClause}`,
      values
    ),
  ]);

  const total = totalResult.rows[0] || {};
  return {
    totalRevenue: parseFloat(total.total || 0),
    totalTransactions: parseInt(total.transaction_count || 0),
    byMonth: byMonthResult.rows.map((row) => ({
      month: row.month,
      transactionCount: parseInt(row.transaction_count),
      amount: parseFloat(row.total_amount),
    })),
  };
};

const generateContentSummary = async (filters = {}) => {
  const { clause, values } = buildDateConditions(filters, 'created_at');
  const [result, statusResult] = await Promise.all([
    query(
      `SELECT
         (SELECT COUNT(*)::int FROM courses ${clause}) AS courses,
         (SELECT COUNT(*)::int FROM lessons ${clause}) AS lessons,
         (SELECT COUNT(*)::int FROM questions ${clause}) AS questions,
         (SELECT COUNT(*)::int FROM exams ${clause}) AS exams`,
      values
    ),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM courses
       GROUP BY status
       ORDER BY count DESC`
    ),
  ]);

  const row = result.rows[0] || {};
  return {
    courses: parseInt(row.courses || 0),
    lessons: parseInt(row.lessons || 0),
    questions: parseInt(row.questions || 0),
    exams: parseInt(row.exams || 0),
    coursesByStatus: statusResult.rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
    })),
  };
};

const generateExamPerformance = async (filters = {}) => {
  const { clause, values } = buildExamConditions(filters);
  const [byExamResult, overallResult] = await Promise.all([
    query(
      `SELECT
         e.id AS exam_id,
         e.title AS exam_title,
         COUNT(ea.id)::int AS attempts,
         COALESCE(AVG(ea.percentage), 0)::numeric(5,2) AS avg_score,
         COALESCE(SUM(CASE WHEN ea.is_passed = TRUE THEN 1 ELSE 0 END), 0)::int AS passed,
         ROUND(
           COALESCE(
             SUM(CASE WHEN ea.is_passed = TRUE THEN 1 ELSE 0 END)::numeric
               / NULLIF(COUNT(ea.id), 0),
             0
           ) * 100,
           2
         ) AS pass_rate
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       ${clause}
       GROUP BY e.id, e.title
       ORDER BY attempts DESC
       LIMIT 50`,
      values
    ),
    query(
      `SELECT
         COUNT(*)::int AS attempts,
         COALESCE(AVG(percentage), 0)::numeric(5,2) AS avg_score,
         COALESCE(SUM(CASE WHEN is_passed = TRUE THEN 1 ELSE 0 END), 0)::int AS passed
       FROM exam_attempts
       ${clause.replaceAll('ea.', '')}`,
      values
    ),
  ]);

  const overall = overallResult.rows[0] || {};
  return {
    totalAttempts: parseInt(overall.attempts || 0),
    averageScore: parseFloat(overall.avg_score || 0),
    passRate: overall.attempts
      ? Math.round(((overall.passed || 0) / overall.attempts) * 100)
      : 0,
    byExam: byExamResult.rows.map((row) => ({
      examId: row.exam_id,
      examTitle: row.exam_title,
      attempts: parseInt(row.attempts),
      averageScore: parseFloat(row.avg_score),
      passed: parseInt(row.passed),
      passRate: parseFloat(row.pass_rate),
    })),
  };
};

const generateSubscriptionsSummary = async (filters = {}) => {
  const { clause, values } = buildDateConditions(filters, 's.created_at');
  const statusClause = clause
    ? `WHERE s.status = 'active' AND ${clause.slice(6)}`
    : `WHERE s.status = 'active'`;
  const result = await query(
    `SELECT
       COALESCE(sp.name, 'unknown') AS plan_name,
       COUNT(s.id)::int AS active_subscriptions,
       COALESCE(SUM(sp.price), 0)::numeric(12,2) AS monthly_value
     FROM subscriptions s
     LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
     ${statusClause}
     GROUP BY sp.name
     ORDER BY active_subscriptions DESC`,
    values
  );

  const byPlan = result.rows.map((row) => ({
    planName: row.plan_name,
    activeSubscriptions: parseInt(row.active_subscriptions),
    monthlyValue: parseFloat(row.monthly_value),
  }));

  return {
    totalActiveSubscriptions: byPlan.reduce((sum, row) => sum + row.activeSubscriptions, 0),
    byPlan,
  };
};

const generateTeacherEarnings = async (filters = {}) => {
  const { clause, values } = buildDateConditions(filters, 'te.created_at');
  const result = await query(
    `SELECT
       te.teacher_id,
       COALESCE(u.first_name || ' ' || u.last_name, 'unknown') AS teacher_name,
       COUNT(te.id)::int AS earnings_count,
       COALESCE(SUM(te.amount), 0)::numeric(14,2) AS total_earnings,
       COALESCE(SUM(te.amount) FILTER (WHERE te.status = 'paid'), 0)::numeric(14,2) AS paid_earnings
     FROM teacher_earnings te
     LEFT JOIN users u ON u.id = te.teacher_id
     ${clause}
     GROUP BY te.teacher_id, u.first_name, u.last_name
     ORDER BY total_earnings DESC
     LIMIT 50`,
    values
  );

  return {
    byTeacher: result.rows.map((row) => ({
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      earningsCount: parseInt(row.earnings_count),
      totalEarnings: parseFloat(row.total_earnings),
      paidEarnings: parseFloat(row.paid_earnings),
    })),
  };
};

const generators = {
  user_summary: generateUserSummary,
  revenue_summary: generateRevenueSummary,
  content_summary: generateContentSummary,
  exam_performance: generateExamPerformance,
  subscriptions_summary: generateSubscriptionsSummary,
  teacher_earnings: generateTeacherEarnings,
};

export const reportService = {
  async generate(type, { title, description, filters = {}, generatedBy }) {
    if (!generators[type]) {
      throw new AppError(`Unsupported report type: ${type}`, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const data = await generators[type](filters);
    const report = await this.create({
      type,
      title: title || `${type.replace(/_/g, ' ')} report`,
      description,
      filters,
      generatedBy,
      data,
    });

    return { report, data };
  },

  async create({ type, title, description, filters = {}, generatedBy, data }) {
    const result = await query(
      `INSERT INTO reports (type, title, description, filters, generated_by, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', NOW())
       RETURNING *`,
      [type, title, description, { ...filters, summary: data }, generatedBy]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, generatedBy }) {
    const values = [];
    let where = '';
    if (generatedBy) {
      values.push(generatedBy);
      where = 'WHERE generated_by = $1';
    }
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM reports ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM reports ${where}`,
      values.slice(0, values.length - 2)
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async getById(id) {
    const result = await query('SELECT * FROM reports WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await query('DELETE FROM reports WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default reportService;
