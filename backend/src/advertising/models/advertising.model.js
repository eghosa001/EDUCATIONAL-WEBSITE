import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const advertisingModel = {
  async findById(id) {
    const result = await query('SELECT * FROM ad_campaigns WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByPlacement(placementId) {
    const result = await query(
      `SELECT ac.* FROM ad_campaigns ac
       JOIN ad_placements ap ON ac.placement_id = ap.id
       WHERE ap.id = $1 AND ac.status = 'active'
       ORDER BY ac.priority ASC
       LIMIT 1`,
      [placementId]
    );
    return result.rows[0] || null;
  },

  async list(params) {
    const { page = 1, limit = 20, status, campaignType, advertiserId, placementId, search } = params;
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (status) { whereClauses.push(`ac.status = $${paramIndex}`); values.push(status); paramIndex++; }
    if (campaignType) { whereClauses.push(`ac.campaign_type = $${paramIndex}`); values.push(campaignType); paramIndex++; }
    if (advertiserId) { whereClauses.push(`ac.advertiser_id = $${paramIndex}`); values.push(advertiserId); paramIndex++; }
    if (placementId) { whereClauses.push(`ac.placement_id = $${paramIndex}`); values.push(placementId); paramIndex++; }
    if (search) { whereClauses.push(`(ac.title ILIKE $${paramIndex} OR ac.description ILIKE $${paramIndex})`); values.push(`%${search}%`); paramIndex++; }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT ac.*, u.first_name AS advertiser_name, u.email AS advertiser_email,
              ap.name AS placement_name, ap.slot_type
       FROM ad_campaigns ac
       LEFT JOIN users u ON ac.advertiser_id = u.id
       LEFT JOIN ad_placements ap ON ac.placement_id = ap.id
       ${whereSql}
       ORDER BY ac.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM ad_campaigns ac ${whereSql}`,
      values
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / parseInt(limit)),
      },
    };
  },

  async create(data) {
    const {
      advertiserId, placementId, title, description, campaignType,
      budget, bidsPerClick, startDate, endDate, status, creativeUrl, targetAudience,
    } = data;
    const result = await query(
      `INSERT INTO ad_campaigns (
        advertiser_id, placement_id, title, description, campaign_type,
        budget, bids_per_click, start_date, end_date, status, creative_url, target_audience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [advertiserId, placementId, title, description, campaignType, budget, bidsPerClick, startDate, endDate, status, creativeUrl, targetAudience]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = ['title', 'description', 'budget', 'bids_per_click', 'start_date', 'end_date', 'status', 'creative_url', 'target_audience'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const result = await query(
      `UPDATE ad_campaigns SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM ad_campaigns WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  // Ad Placements
  async listPlacements(params = {}) {
    const { page = 1, limit = 20, slotType } = params;
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (slotType) { whereClauses.push(`slot_type = $${paramIndex}`); values.push(slotType); paramIndex++; }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM ad_placements ${whereSql} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) as total FROM ad_placements ${whereSql}`, values);

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / parseInt(limit)),
      },
    };
  },

  async createPlacement(data) {
    const { name, slotType, width, height, description, isActive } = data;
    const result = await query(
      `INSERT INTO ad_placements (name, slot_type, width, height, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slotType, width, height, description, isActive]
    );
    return result.rows[0];
  },

  async updatePlacement(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = ['name', 'slot_type', 'width', 'height', 'description', 'is_active'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const result = await query(
      `UPDATE ad_placements SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deletePlacement(id) {
    const result = await query('DELETE FROM ad_placements WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  // Impression & Click tracking
  async recordImpression(adCampaignId, userId = null) {
    const result = await query(
      `INSERT INTO ad_impressions (ad_campaign_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [adCampaignId, userId]
    );
    return result.rows[0];
  },

  async recordClick(adCampaignId, userId = null, referrer = null) {
    const result = await query(
      `INSERT INTO ad_clicks (ad_campaign_id, user_id, referrer)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [adCampaignId, userId, referrer]
    );
    return result.rows[0];
  },

  async getPlacementActiveCampaign(placementId) {
    return await this.findByPlacement(placementId);
  },
};
