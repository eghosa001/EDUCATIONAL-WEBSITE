import { pool } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listEducationSystems = async (req, res) => {
  const { page, limit, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE is_active = TRUE';
  const params = [];
  let paramIndex = 1;

  if (search) {
    whereClause += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex} OR country ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM education_systems ${whereClause}`,
    params
  );

  const result = await pool.query(
    `SELECT * FROM education_systems ${whereClause} ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: {
      systems: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    },
  });
};

export const createEducationSystem = async (req, res) => {
  const { name, code, country, description } = req.body;

  const result = await pool.query(
    `INSERT INTO education_systems (name, code, country, description)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, code.toLowerCase(), country, description]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Education system created',
    data: { system: result.rows[0] },
  });
};

export const getEducationSystem = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query('SELECT * FROM education_systems WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Education system not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, data: { system: result.rows[0] } });
};

export const getLevels = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM education_levels WHERE education_system_id = $1 AND is_active = TRUE ORDER BY order_index',
    [id]
  );

  res.json({ success: true, data: { levels: result.rows } });
};

export const createLevel = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, orderIndex, minAge, maxAge } = req.body;

  const result = await pool.query(
    `INSERT INTO education_levels (education_system_id, name, code, description, order_index, min_age, max_age)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, name, code.toLowerCase(), description, orderIndex, minAge, maxAge]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Level created',
    data: { level: result.rows[0] },
  });
};

export const getLevel = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query('SELECT * FROM education_levels WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Level not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, data: { level: result.rows[0] } });
};

export const getPrograms = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM programs WHERE education_level_id = $1 AND is_active = TRUE ORDER BY order_index',
    [id]
  );

  res.json({ success: true, data: { programs: result.rows } });
};

export const createProgram = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, durationYears, orderIndex } = req.body;

  const result = await pool.query(
    `INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, name, code.toLowerCase(), description, durationYears, orderIndex]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Program created',
    data: { program: result.rows[0] },
  });
};

export const getProgram = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Program not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, data: { program: result.rows[0] } });
};

export const getClasses = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM classes WHERE program_id = $1 AND is_active = TRUE ORDER BY order_index',
    [id]
  );

  res.json({ success: true, data: { classes: result.rows } });
};

export const createClass = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, orderIndex } = req.body;

  const result = await pool.query(
    `INSERT INTO classes (program_id, name, code, description, order_index)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, name, code.toLowerCase(), description, orderIndex]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Class created',
    data: { class: result.rows[0] },
  });
};

export const getClass = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query('SELECT * FROM classes WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Class not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, data: { class: result.rows[0] } });
};

export const listTerms = async (req, res) => {
  const { page, limit, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE is_active = TRUE';
  const params = [];
  let paramIndex = 1;

  if (search) {
    whereClause += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM terms ${whereClause}`,
    params
  );

  const result = await pool.query(
    `SELECT * FROM terms ${whereClause} ORDER BY order_index LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: {
      terms: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    },
  });
};

export const createTerm = async (req, res) => {
  const { educationSystemId, name, code, description, orderIndex } = req.body;

  const result = await pool.query(
    `INSERT INTO terms (education_system_id, name, code, description, order_index)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [educationSystemId, name, code.toLowerCase(), description, orderIndex]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Term created',
    data: { term: result.rows[0] },
  });
};