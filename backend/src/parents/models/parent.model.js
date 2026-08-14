import { query } from '../../common/database/index.js';

export const parentModel = {
  async findById(id) {
    const result = await query('SELECT * FROM parents WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId) {
    const result = await query('SELECT * FROM parents WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { userId, occupation, phone, address } = data;
    const result = await query(
      `INSERT INTO parents (user_id, occupation, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, occupation ?? null, phone ?? null, address ?? null]
    );
    return result.rows[0];
  },

  async update(userId, data) {
    const result = await query(
      `UPDATE parents SET
         occupation = COALESCE($2, occupation),
         phone = COALESCE($3, phone),
         address = COALESCE($4, address),
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, data.occupation, data.phone, data.address]
    );
    return result.rows[0] || null;
  },

  async upsert(userId, data = {}) {
    const existing = await this.findByUserId(userId);
    if (existing) return this.update(userId, data);
    return this.create({ userId, ...data });
  },
};

export default parentModel;
