import { query } from '../../common/database/index.js';

export const educationService = {
  async listSystems(params) {
    const conditions = [];
    const values = [];
    if (params?.isActive !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(params.isActive);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM education_systems ${where} ORDER BY name`, values);
    return result.rows;
  },

  async createSystem(data) {
    const result = await query(
      `INSERT INTO education_systems (name, code, country, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.code, data.country, data.description]
    );
    return result.rows[0];
  },

  async listLevels(systemId) {
    const result = await query(
      'SELECT * FROM education_levels WHERE education_system_id = $1 ORDER BY order_index',
      [systemId]
    );
    return result.rows;
  },

  async listClasses(programId) {
    const result = await query(
      'SELECT * FROM classes WHERE program_id = $1 ORDER BY order_index',
      [programId]
    );
    return result.rows;
  },

  async listTerms(systemId) {
    const result = await query(
      'SELECT * FROM terms WHERE education_system_id = $1 ORDER BY order_index',
      [systemId]
    );
    return result.rows;
  },

  async getFullHierarchy() {
    const systems = await this.listSystems();
    const result = [];

    for (const system of systems) {
      const levels = await this.listLevels(system.id);
      const systemData = { ...system, levels: [] };

      for (const level of levels) {
        const programsResult = await query(
          'SELECT * FROM programs WHERE education_level_id = $1 ORDER BY order_index',
          [level.id]
        );
        const programDataList = [];

        for (const program of programsResult.rows) {
          const classesResult = await query(
            'SELECT * FROM classes WHERE program_id = $1 ORDER BY order_index',
            [program.id]
          );
          programDataList.push({ ...program, classes: classesResult.rows });
        }

        systemData.levels.push({ ...level, programs: programDataList });
      }
      result.push(systemData);
    }
    return result;
  },
};

export default educationService;
