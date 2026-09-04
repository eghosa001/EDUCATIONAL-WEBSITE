import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { marketplaceService } from './marketplace/services/marketplace.service.js';
import { marketplaceModel } from './marketplace/models/marketplace.model.js';
import { corporateTrainingService } from './corporate-training/services/corporateTraining.service.js';
import { affiliateService } from './affiliate/services/affiliate.service.js';
import { advertisingService } from './advertising/services/advertising.service.js';
import { query, pool } from './common/database/index.js';

let dbAvailable = false;

async function setupDB() {
  try {
    await query('SELECT 1');
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
}

describe('Marketplace Service', () => {
  before(async () => { await setupDB(); });
  after(async () => { if (dbAvailable) try { await pool.end(); } catch {} });

  it('should list products with pagination', async () => {
    if (!dbAvailable) return;
    const result = await marketplaceService.listProducts({ page: 1, limit: 20 });
    assert.ok(result);
    assert.ok(Array.isArray(result.data));
  });

  it('should create and retrieve a product', async () => {
    if (!dbAvailable) return;
    const product = await marketplaceService.createProduct({
      sellerId: '00000000-0000-0000-0000-000000000000',
      title: 'Test Product',
      slug: 'test-product',
      price: 5000,
    });
    assert.ok(product);
    assert.strictEqual(product.title, 'Test Product');
  });
});

describe('Corporate Training Service', () => {
  before(async () => { await setupDB(); });
  after(async () => { if (dbAvailable) try { await pool.end(); } catch {} });

  it('should list trainings', async () => {
    if (!dbAvailable) return;
    const result = await corporateTrainingService.listTrainings({ page: 1, limit: 20 });
    assert.ok(result);
    assert.ok(Array.isArray(result.data));
  });

  it('should create a training', async () => {
    if (!dbAvailable) return;
    const result = await corporateTrainingService.createTraining({
      organizationId: '00000000-0000-0000-0000-000000000000',
      createdBy: '00000000-0000-0000-0000-000000000000',
      title: 'AWS Training',
      status: 'active',
    });
    assert.ok(result);
    assert.strictEqual(result.title, 'AWS Training');
  });
});

describe('Affiliate Service', () => {
  before(async () => { await setupDB(); });
  after(async () => { if (dbAvailable) try { await pool.end(); } catch {} });

  it('should get or create affiliate for user', async () => {
    if (!dbAvailable) return;
    const result = await affiliateService.getOrCreateAffiliate('00000000-0000-0000-0000-000000000000');
    assert.ok(result);
  });
});

describe('Advertising Service', () => {
  before(async () => { await setupDB(); });
  after(async () => { if (dbAvailable) try { await pool.end(); } catch {} });

  it('should list campaigns', async () => {
    if (!dbAvailable) return;
    const result = await advertisingService.listCampaigns({ page: 1, limit: 20 });
    assert.ok(result);
    assert.ok(Array.isArray(result.data));
  });
});
