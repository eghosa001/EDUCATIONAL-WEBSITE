import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { advertisingModel } from '../models/advertising.model.js';

export const advertisingService = {
  // Campaigns
  async listCampaigns(params) {
    return await advertisingModel.list(params);
  },

  async getCampaign(id) {
    const campaign = await advertisingModel.findById(id);
    if (!campaign) throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return campaign;
  },

  async createCampaign(data) {
    return await advertisingModel.create(data);
  },

  async updateCampaign(id, data) {
    const campaign = await advertisingModel.findById(id);
    if (!campaign) throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await advertisingModel.update(id, data);
  },

  async deleteCampaign(id) {
    const campaign = await advertisingModel.findById(id);
    if (!campaign) throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await advertisingModel.delete(id);
  },

  // Placements
  async listPlacements(params) {
    return await advertisingModel.listPlacements(params);
  },

  async createPlacement(data) {
    return await advertisingModel.createPlacement(data);
  },

  async updatePlacement(id, data) {
    return await advertisingModel.updatePlacement(id, data);
  },

  async deletePlacement(id) {
    return await advertisingModel.deletePlacement(id);
  },

  // Active campaign for a placement
  async getActiveAdForPlacement(placementId) {
    const campaign = await advertisingModel.getPlacementActiveCampaign(placementId);
    return campaign;
  },

  // Tracking
  async recordImpression(adCampaignId, userId = null) {
    return await advertisingModel.recordImpression(adCampaignId, userId);
  },

  async recordClick(adCampaignId, userId = null, referrer = null) {
    return await advertisingModel.recordClick(adCampaignId, userId, referrer);
  },

  // Stats
  async getCampaignStats(campaignId) {
    const [impressions, clicks, conversions] = await Promise.all([
      query('SELECT COUNT(*) as total FROM ad_impressions WHERE ad_campaign_id = $1', [campaignId]),
      query('SELECT COUNT(*) as total FROM ad_clicks WHERE ad_campaign_id = $1', [campaignId]),
      query("SELECT COUNT(*) as total FROM affiliate_conversions ac JOIN ad_campaigns acp ON ac.ref_code LIKE '%' || acp.id || '%' WHERE acp.id = $1", [campaignId]),
    ]);

    const impCount = parseInt(impressions.rows[0]?.total || 0);
    const clickCount = parseInt(clicks.rows[0]?.total || 0);

    return {
      impressions: impCount,
      clicks: clickCount,
      conversionRate: impCount > 0 ? ((clickCount / impCount) * 100).toFixed(2) : 0,
      ctr: impCount > 0 ? ((clickCount / impCount) * 100).toFixed(2) : 0,
    };
  },
};
