import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const feesService = {
  async list(schoolId, filters = {}) {
    const { studentId, classId, status, termId, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['f.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (studentId) {
      conditions.push(`f.student_id = $${idx++}`);
      values.push(studentId);
    }
    if (classId) {
      conditions.push(`f.class_id = $${idx++}`);
      values.push(classId);
    }
    if (status) {
      conditions.push(`f.status = $${idx++}`);
      values.push(status);
    }
    if (termId) {
      conditions.push(`f.term_id = $${idx++}`);
      values.push(termId);
    }

    const where = conditions.join(' AND ');

    const [result, countResult] = await Promise.all([
      query(
        `SELECT f.*, 
                u.first_name, u.last_name, u.email,
                c.name AS class_name, c.code AS class_code
         FROM school_fees f
         JOIN users u ON f.student_id = u.id
         LEFT JOIN classes c ON f.class_id = c.id
         WHERE ${where}
         ORDER BY f.due_date ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM school_fees f WHERE ${where}`, values),
    ]);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / limit),
      },
    };
  },

  async getSummary(schoolId, filters = {}) {
    const conditions = ['f.school_id = $1'];
    const values = [schoolId];
    let idx = 2;

    if (filters.classId) {
      conditions.push(`f.class_id = $${idx++}`);
      values.push(filters.classId);
    }
    if (filters.termId) {
      conditions.push(`f.term_id = $${idx++}`);
      values.push(filters.termId);
    }
    if (filters.academicYear) {
      conditions.push(`f.academic_year = $${idx++}`);
      values.push(filters.academicYear);
    }

    const where = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        COUNT(*)::int AS total_fees,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::int AS paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_count,
        COUNT(CASE WHEN status = 'partial' THEN 1 END)::int AS partial_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END)::int AS overdue_count,
        COALESCE(SUM(final_amount), 0) AS total_amount,
        COALESCE(SUM(amount_paid), 0) AS total_collected,
        COALESCE(SUM(balance), 0) AS total_balance
       FROM school_fees f WHERE ${where}`,
      values
    );

    return result.rows[0] || {};
  },

  async create(data) {
    const result = await query(
      `INSERT INTO school_fees (school_id, student_id, class_id, term_id, academic_year, fee_type, description, amount, discount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.schoolId, data.studentId, data.classId || null, data.termId || null,
        data.academicYear, data.feeType, data.description || null,
        data.amount, data.discount || 0,
      ]
    );
    return result.rows[0];
  },

  async recordPayment(id, data) {
    const { amount, reference } = data;
    const fee = await query('SELECT * FROM school_fees WHERE id = $1', [id]);
    if (!fee.rows[0]) throw new AppError('Fee record not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

    const newPaid = parseFloat(fee.rows[0].amount_paid) + amount;
    const finalAmount = parseFloat(fee.rows[0].final_amount);
    let newStatus = 'partial';
    if (newPaid >= finalAmount) newStatus = 'paid';
    if (finalAmount === 0) newStatus = 'waived';

    const result = await query(
      `UPDATE school_fees 
       SET amount_paid = $2, status = $3, paid_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id, newPaid, newStatus]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    const checks = ['fee_type', 'description', 'amount', 'discount', 'due_date', 'status'];
    for (const key of checks) {
      const val = data[key];
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const result = await query(
      `UPDATE school_fees SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM school_fees WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },
};

export default feesService;
