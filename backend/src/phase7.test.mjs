import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Marketplace Service', () => {
  it('should export listProducts function', async () => {
    const { marketplaceService } = await import('./marketplace/services/marketplace.service.js');
    assert.equal(typeof marketplaceService.listProducts, 'function');
  });

  it('should export createProduct function', async () => {
    const { marketplaceService } = await import('./marketplace/services/marketplace.service.js');
    assert.equal(typeof marketplaceService.createProduct, 'function');
  });

  it('should export addToCart function', async () => {
    const { marketplaceService } = await import('./marketplace/services/marketplace.service.js');
    assert.equal(typeof marketplaceService.addToCart, 'function');
  });
});

describe('Corporate Training Service', () => {
  it('should export listTrainings function', async () => {
    const { corporateTrainingService } = await import('./corporate-training/services/corporateTraining.service.js');
    assert.equal(typeof corporateTrainingService.listTrainings, 'function');
  });

  it('should export bulkEnrollUsers function', async () => {
    const { corporateTrainingService } = await import('./corporate-training/services/corporateTraining.service.js');
    assert.equal(typeof corporateTrainingService.bulkEnrollUsers, 'function');
  });
});

describe('Affiliate Service', () => {
  it('should export getOrCreateAffiliate function', async () => {
    const { affiliateService } = await import('./affiliate/services/affiliate.service.js');
    assert.equal(typeof affiliateService.getOrCreateAffiliate, 'function');
  });

  it('should export recordClick function', async () => {
    const { affiliateService } = await import('./affiliate/services/affiliate.service.js');
    assert.equal(typeof affiliateService.recordClick, 'function');
  });
});

describe('Advertising Service', () => {
  it('should export listCampaigns function', async () => {
    const { advertisingService } = await import('./advertising/services/advertising.service.js');
    assert.equal(typeof advertisingService.listCampaigns, 'function');
  });

  it('should export recordImpression function', async () => {
    const { advertisingService } = await import('./advertising/services/advertising.service.js');
    assert.equal(typeof advertisingService.recordImpression, 'function');
  });
});

describe('Phase 7 Route Modules', () => {
  it('marketplace routes should be a valid Express router', async () => {
    const { marketplaceRoutes } = await import('./routes/marketplace.routes.js');
    assert.equal(typeof marketplaceRoutes.use, 'function');
  });

  it('corporate training routes should be a valid Express router', async () => {
    const { corporateTrainingRoutes } = await import('./routes/corporate-training.routes.js');
    assert.equal(typeof corporateTrainingRoutes.use, 'function');
  });

  it('affiliate routes should be a valid Express router', async () => {
    const { affiliateRoutes } = await import('./routes/affiliate.routes.js');
    assert.equal(typeof affiliateRoutes.use, 'function');
  });

  it('advertising routes should be a valid Express router', async () => {
    const { advertisingRoutes } = await import('./routes/advertising.routes.js');
    assert.equal(typeof advertisingRoutes.use, 'function');
  });
});
