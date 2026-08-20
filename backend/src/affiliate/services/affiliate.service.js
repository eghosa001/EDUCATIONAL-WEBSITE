import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { affiliateModel } from '../models/affiliate.model.js';

export const affiliateService = {
  async getOrCreateAffiliate(userId) {
    let affiliate = await affiliateModel.findByUserId(userId);
    if (affiliate) return affiliate;

    const refCode = `REF-${userId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    affiliate = await affiliateModel.create({
      userId,
      refCode,
      commissionRate: 10,
      payoutThreshold: 5000,
      status: 'active',
    });
    return affiliate;
  },

  async listAffiliates(params) {
    return await affiliateModel.list(params);
  },

  async getAffiliate(id) {
    const affiliate = await affiliateModel.findById(id);
    if (!affiliate) throw new AppError('Affiliate not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return affiliate;
  },

  async updateAffiliate(id, data) {
    const affiliate = await affiliateModel.findById(id);
    if (!affiliate) throw new AppError('Affiliate not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await affiliateModel.update(id, data);
  },

  async getMyAffiliateStats(userId) {
    const affiliate = await affiliateModel.findByUserId(userId);
    if (!affiliate) return null;
    return await affiliateModel.getAffiliateStats(userId);
  },

  async recordClick(data) {
    return await affiliateModel.recordClick(data);
  },

  async recordConversion(data) {
    return await affiliateModel.recordConversion(data);
  },

  async getPendingPayouts(userId, params = {}) {
    return await affiliateModel.getPendingPayouts(userId, params);
  },

  async processPayout(conversionIds, userId) {
    const result = await query(
      `UPDATE affiliate_conversions
       SET payout_status = 'paid'
       WHERE id = ANY($1) AND affiliate_id = (SELECT id FROM affiliates WHERE user_id = $2)
       RETURNING *`,
      [conversionIds, userId]
    );
    return result.rows;
  },

  async getReferralLink(userId) {
    const affiliate = await affiliateModel.findByUserId(userId);
    if (!affiliate) return null;
    return {
      refCode: affiliate.ref_code,
      link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${affiliate.ref_code}`,
    };
  },
};
