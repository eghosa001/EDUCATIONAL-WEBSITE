import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { advertisingService } from '../services/advertising.service.js';

export async function listCampaigns(req, res) {
  const result = await advertisingService.listCampaigns(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getCampaign(req, res) {
  const campaign = await advertisingService.getCampaign(req.params.id);
  res.json({ success: true, data: campaign });
}

export async function createCampaign(req, res) {
  const campaign = await advertisingService.createCampaign({
    ...req.body,
    advertiserId: req.user.id,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: campaign });
}

export async function updateCampaign(req, res) {
  const campaign = await advertisingService.updateCampaign(req.params.id, req.body);
  res.json({ success: true, data: campaign });
}

export async function deleteCampaign(req, res) {
  await advertisingService.deleteCampaign(req.params.id);
  res.json({ success: true, message: 'Campaign deleted' });
}

export async function getCampaignStats(req, res) {
  const stats = await advertisingService.getCampaignStats(req.params.id);
  res.json({ success: true, data: stats });
}

export async function listPlacements(req, res) {
  const result = await advertisingService.listPlacements(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function createPlacement(req, res) {
  const placement = await advertisingService.createPlacement(req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: placement });
}

export async function updatePlacement(req, res) {
  const placement = await advertisingService.updatePlacement(req.params.id, req.body);
  res.json({ success: true, data: placement });
}

export async function deletePlacement(req, res) {
  await advertisingService.deletePlacement(req.params.id);
  res.json({ success: true, message: 'Placement deleted' });
}

export async function getActiveAdForPlacement(req, res) {
  const campaign = await advertisingService.getActiveAdForPlacement(req.params.placementId);
  res.json({ success: true, data: campaign });
}

export async function recordImpression(req, res) {
  const impression = await advertisingService.recordImpression(req.body.adCampaignId, req.user?.id || null);
  res.json({ success: true, data: impression });
}

export async function recordClick(req, res) {
  const click = await advertisingService.recordClick(
    req.body.adCampaignId,
    req.user?.id || null,
    req.body.referrer
  );
  res.json({ success: true, data: click });
}
