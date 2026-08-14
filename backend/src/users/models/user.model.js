import { query, transaction } from '../../common/database/index.js';

export const userModel = {
  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findByPhone(phone) {
    const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0] || null;
  },

  async findByEmailOrPhone(email, phone) {
    const result = await query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      email, phone, passwordHash, firstName, lastName, middleName,
      dateOfBirth, gender, avatarUrl,
    } = data;

    const result = await query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, middle_name, date_of_birth, gender, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [email, phone, passwordHash, firstName, lastName, middleName, dateOfBirth, gender, avatarUrl]
    );

    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const mappings = {
      firstName: 'first_name',
      lastName: 'last_name',
      middleName: 'middle_name',
      phone: 'phone',
      avatarUrl: 'avatar_url',
      isVerified: 'is_verified',
      isActive: 'is_active',
      lastLoginAt: 'last_login_at',
      emailVerifiedAt: 'email_verified_at',
      phoneVerifiedAt: 'phone_verified_at',
    };

    let index = 1;
    for (const [key, column] of Object.entries(mappings)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${index}`);
        values.push(data[key]);
        index += 1;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, search, role, status, schoolId } = {}) {
    const conditions = [];
    const values = [];

    if (search) {
      conditions.push(`(first_name ILIKE $${values.length + 1} OR last_name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }

    if (role) {
      conditions.push(`EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = users.id AND r.name = $${values.length + 1})`);
      values.push(role);
    }

    if (status) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(status === 'active');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
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

  async addRole(userId, roleId, assignedBy) {
    const result = await query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, role_id) DO NOTHING
       RETURNING *`,
      [userId, roleId, assignedBy]
    );
    return result.rows[0] || null;
  },

  async getRoles(userId) {
    const result = await query(
      `SELECT r.id, r.name, r.permissions
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  async removeRole(userId, roleId) {
    await query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, roleId]);
  },

  async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async createWithRoles(data, roles) {
    return transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, middle_name, date_of_birth, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [data.email, data.phone, data.passwordHash, data.firstName, data.lastName, data.middleName, data.dateOfBirth, data.gender]
      );
      const user = rows[0];

      for (const role of roles) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2`,
          [user.id, role]
        );
      }

      return user;
    });
  },
};

export default userModel;
