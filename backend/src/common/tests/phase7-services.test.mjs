import { describe, it, expect, beforeEach, vi } from 'vitest';
import { marketplaceService } from '../../src/marketplace/services/marketplace.service.js';
import { marketplaceModel } from '../../src/marketplace/models/marketplace.model.js';
import { corporateTrainingService } from '../../src/corporate-training/services/corporateTraining.service.js';
import { affiliateService } from '../../src/affiliate/services/affiliate.service.js';
import { advertisingService } from '../../src/advertising/services/advertising.service.js';

vi.mock('../../src/common/database/index.js', () => ({
  query: vi.fn(),
}));

const mockQuery = vi.importMock('../../src/common/database/index.js');

describe('Marketplace Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should list products with pagination', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: '1', title: 'Math EBook' }] });
    mockQuery.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const result = await marketplaceService.listProducts({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Math EBook');
  });

  it('should create a product', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 'new-id', title: 'New Product' }] });

    const result = await marketplaceService.createProduct({
      sellerId: 'seller-1',
      title: 'New Product',
      slug: 'new-product',
      price: 5000,
    });
    expect(result.title).toBe('New Product');
  });
});

describe('Corporate Training Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should list trainings', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: '1', title: 'Python Course' }] });
    mockQuery.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const result = await corporateTrainingService.listTrainings({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
  });

  it('should create a training', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 't1', title: 'AWS Training' }] });

    const result = await corporateTrainingService.createTraining({
      organizationId: 'org-1',
      createdBy: 'user-1',
      title: 'AWS Training',
      status: 'active',
    });
    expect(result.title).toBe('AWS Training');
  });
});

describe('Affiliate Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should get or create affiliate for user', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [] });
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 'aff-1', ref_code: 'REF-ABC' }] });

    const result = await affiliateService.getOrCreateAffiliate('user-1');
    expect(result).toBeTruthy();
  });

  it('should record a click', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 'a1', ref_code: 'REF-TEST' }] });
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 'click-1' }] });

    const result = await affiliateService.recordClick({
      refCode: 'REF-TEST',
      clickSource: 'email',
      userAgent: 'Mozilla/5.0',
      ip: '127.0.0.1',
    });
    expect(result).toBeTruthy();
  });
});

describe('Advertising Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should list campaigns', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 'c1', title: 'Banner Ad' }] });
    mockQuery.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const result = await advertisingService.listCampaigns({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
  });

  it('should record an impression', async () => {
    mockQuery.query.mockResolvedValueOnce({ rows: [{ id: 'imp-1' }] });

    const result = await advertisingService.recordImpression('campaign-1', 'user-1');
    expect(result).toBeTruthy();
  });
});
