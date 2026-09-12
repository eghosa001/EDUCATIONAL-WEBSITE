import { pool } from '../database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../errors/index.js';

export const protectLastSuperAdminRemoval = async (req, _res, next) => {
  const { id: userId, roleId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query(
      `SELECT r.name
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND ur.role_id = $2
        FOR UPDATE OF ur`,
      [userId, roleId]
    );

    if (target.rows[0]?.name === 'super_admin') {
      const admins = await client.query(
        `SELECT ur.user_id
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
          WHERE r.name = 'super_admin'
          FOR UPDATE OF ur`
      );
      if (admins.rowCount <= 1) {
        throw new AppError(
          'Cannot remove the last super administrator',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Perform the guarded delete while the super-admin assignments are still locked.
    // The controller's following DELETE is intentionally idempotent and becomes a no-op.
    await client.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    await client.query('COMMIT');
    next();
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

export default protectLastSuperAdminRemoval;
