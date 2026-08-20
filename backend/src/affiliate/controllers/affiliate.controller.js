import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { affiliateService } from '../services/affiliate.service.js';

export async function listAffiliates(req, res) {
  const result = await affiliateService.listAffiliates(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getMyAffiliateStats(req, res) {
  let stats = await affiliateService.getMyAffiliateStats(req.user.id);
  if (!stats) {
    const affiliate = await affiliateService.getOrCreateAffiliate(req.user.id);
    stats = affiliate;
  }
  res.json({ success: true, data: stats });
}

export async function getReferralLink(req, res) {
  const link = await affiliateService.getReferralLink(req.user.id);
  res.json({ success: true, data: link });
}

export async function recordClick(req, res) {
  const click = await affiliateService.recordClick({
    refCode: req.query.ref,
    clickSource: req.headers.referer || 'direct',
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.json({ success: true, data: click });
}

export async function recordConversion(req, res) {
  const conversion = await affiliateService.recordConversion(req.body);
  res.json({ success: true, data: conversion });
}

export async function getPendingPayouts(req, res) {
  const result = await affiliateService.getPendingPayouts(req.user.id, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function processPayout(req, res) {
  const payouts = await affiliateService.processPayout(req.body.conversionIds, req.user.id);
  res.json({ success: true, data: payouts });
}
