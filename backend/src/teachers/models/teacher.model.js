import { query } from '../../common/database/index.js';

export const teacherModel = {
  async findById(id) {
    const result = await query('SELECT * FROM teachers WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId) {
    const result = await query('SELECT * FROM teachers WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      userId, qualification, specialization, bio, avatarUrl,
      payoutAccount, isVerified,
    } = data;
    const result = await query(
      `INSERT INTO teachers (
         user_id, qualification, specialization, bio, avatar_url,
         payout_account, is_verified
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId, qualification ?? null, specialization ?? null, bio ?? null,
        avatarUrl ?? null, payoutAccount ?? null, isVerified ?? false,
      ]
    );
    return result.rows[0];
  },

  async update(userId, data) {
    const result = await query(
      `UPDATE teachers SET
         qualification = COALESCE($2, qualification),
         specialization = COALESCE($3, specialization),
         bio = COALESCE($4, bio),
         avatar_url = COALESCE($5, avatar_url),
         payout_account = COALESCE($6, payout_account),
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, data.qualification, data.specialization, data.bio, data.avatarUrl, data.payoutAccount]
    );
    return result.rows[0] || null;
  },

  async upsert(userId, data = {}) {
    const existing = await this.findByUserId(userId);
    if (existing) return this.update(userId, data);
    return this.create({ userId, ...data });
  },
};

export default teacherModel;
