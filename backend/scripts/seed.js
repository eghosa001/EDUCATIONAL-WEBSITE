import { query, closePool } from '../src/common/database/index.js';
import { USER_ROLES } from '../src/common/constants/index.js';
import bcrypt from 'bcryptjs';

const ROLE_DESCRIPTIONS = {
  [USER_ROLES.STUDENT]: 'Student learner',
  [USER_ROLES.PARENT]: 'Parent or guardian',
  [USER_ROLES.TEACHER]: 'Teacher / educator',
  [USER_ROLES.SCHOOL_ADMIN]: 'School administrator',
  [USER_ROLES.CONTENT_ADMIN]: 'Content administrator',
  [USER_ROLES.SUPER_ADMIN]: 'Platform super administrator',
};

const EDUCATION_SYSTEMS = [
  {
    name: 'Nigerian National Curriculum',
    code: 'NG-NCC',
    country: 'Nigeria',
    description: 'The Nigerian national education curriculum across basic and senior secondary education.',
    levels: [
      { name: 'Primary 1', code: 'P1', orderIndex: 1, minAge: 6, maxAge: 7, description: 'First year of primary education' },
      { name: 'Primary 2', code: 'P2', orderIndex: 2, minAge: 7, maxAge: 8, description: 'Second year of primary education' },
      { name: 'Primary 3', code: 'P3', orderIndex: 3, minAge: 8, maxAge: 9, description: 'Third year of primary education' },
      { name: 'Primary 4', code: 'P4', orderIndex: 4, minAge: 9, maxAge: 10, description: 'Fourth year of primary education' },
      { name: 'Primary 5', code: 'P5', orderIndex: 5, minAge: 10, maxAge: 11, description: 'Fifth year of primary education' },
      { name: 'Primary 6', code: 'P6', orderIndex: 6, minAge: 11, maxAge: 12, description: 'Final year of primary education' },
      { name: 'Junior Secondary 1', code: 'JSS1', orderIndex: 7, minAge: 12, maxAge: 13, description: 'First year of junior secondary education' },
      { name: 'Junior Secondary 2', code: 'JSS2', orderIndex: 8, minAge: 13, maxAge: 14, description: 'Second year of junior secondary education' },
      { name: 'Junior Secondary 3', code: 'JSS3', orderIndex: 9, minAge: 14, maxAge: 15, description: 'Final year of junior secondary education (BECE)' },
      { name: 'Senior Secondary 1', code: 'SSS1', orderIndex: 10, minAge: 15, maxAge: 16, description: 'First year of senior secondary education' },
      { name: 'Senior Secondary 2', code: 'SSS2', orderIndex: 11, minAge: 16, maxAge: 17, description: 'Second year of senior secondary education' },
      { name: 'Senior Secondary 3', code: 'SSS3', orderIndex: 12, minAge: 17, maxAge: 18, description: 'Final year of senior secondary education (WAEC/NECO/JAMB)' },
    ],
    terms: [
      { name: 'First Term', code: 'TERM-1', orderIndex: 1, description: 'First academic term' },
      { name: 'Second Term', code: 'TERM-2', orderIndex: 2, description: 'Second academic term' },
      { name: 'Third Term', code: 'TERM-3', orderIndex: 3, description: 'Third academic term' },
    ],
  },
];

const seedRoles = async () => {
  for (const [name, description] of Object.entries(ROLE_DESCRIPTIONS)) {
    await query(
      `INSERT INTO roles (name, description, permissions)
       VALUES ($1, $2, '{}'::jsonb)
       ON CONFLICT (name) DO NOTHING`,
      [name, description]
    );
  }
  console.log('Roles seeded:', Object.keys(ROLE_DESCRIPTIONS).length);
};

const seedEducation = async () => {
  for (const system of EDUCATION_SYSTEMS) {
    const sys = await query(
      `INSERT INTO education_systems (name, code, country, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country
       RETURNING id`,
      [system.name, system.code, system.country, system.description]
    );
    const systemId = sys.rows[0].id;

    for (const level of system.levels) {
      const levelRes = await query(
        `INSERT INTO education_levels (education_system_id, name, code, description, order_index, min_age, max_age)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (education_system_id, code) DO UPDATE
           SET name = EXCLUDED.name,
               education_system_id = EXCLUDED.education_system_id,
               order_index = EXCLUDED.order_index
         RETURNING id`,
        [systemId, level.name, level.code, level.description, level.orderIndex, level.minAge, level.maxAge]
      );
      const levelId = levelRes.rows[0].id;

      const programRes = await query(
        `INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (education_level_id, code) DO UPDATE SET education_level_id = EXCLUDED.education_level_id, order_index = EXCLUDED.order_index
         RETURNING id`,
        [levelId, `${level.name} Program`, `${level.code}-PGM`, `${level.name} general program`, 1, level.orderIndex]
      );
      const programId = programRes.rows[0].id;

      for (const cls of ['A', 'B']) {
        await query(
          `INSERT INTO classes (program_id, name, code, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (program_id, code) DO UPDATE SET name = EXCLUDED.name`,
          [programId, `Class ${cls}`, `${level.code}-${cls}`, cls === 'A' ? 1 : 2]
        );
      }
    }

    for (const term of system.terms || []) {
      await query(
        `INSERT INTO terms (education_system_id, name, code, description, order_index)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (education_system_id, code) DO UPDATE
           SET name = EXCLUDED.name, order_index = EXCLUDED.order_index`,
        [systemId, term.name, term.code, term.description, term.orderIndex]
      );
    }
    console.log(`Education seeded: ${system.name} (${system.levels.length} levels, ${(system.terms || []).length} terms)`);
  }
};

const seedDemoUsers = async (config) => {
  if (!config) return;
  const passwordHash = await bcrypt.hash(config.password, 12);
  const { data, email, firstName, lastName, role } = config;
  const created = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, is_verified)
     VALUES ($1, $2, $3, $4, TRUE)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, passwordHash, firstName, lastName]
  );
  if (created.rows.length === 0) {
    console.log(`Demo user already exists: ${email}`);
    return;
  }
  const user = created.rows[0];
  const roleRes = await query('SELECT id FROM roles WHERE name = $1', [role]);
  if (roleRes.rows.length > 0) {
    await query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, roleRes.rows[0].id]
    );
  }
  console.log(`Demo user seeded: ${email} (${role}${data ? ', ' + data : ''})`);
};

const run = async () => {
  await seedRoles();
  await seedEducation();
  await seedDemoUsers({
    email: 'admin@learnforge.ng',
    password: 'Admin@12345',
    firstName: 'Platform',
    lastName: 'Admin',
    role: USER_ROLES.SUPER_ADMIN,
  });
  await closePool();
  console.log('Seed complete.');
};

run().catch((error) => {
  console.error('Seed failed:', error);
  closePool();
  process.exit(1);
});
