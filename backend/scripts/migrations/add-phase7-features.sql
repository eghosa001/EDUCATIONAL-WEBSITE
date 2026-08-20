-- Phase 7: Marketplace, Corporate Training, Affiliate, Advertising

-- ===================== MARKETPLACE =====================

CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  file_type VARCHAR(50),
  file_size_bytes BIGINT,
  file_url TEXT,
  thumbnail_url TEXT,
  tags JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft',
  sales_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_slug ON marketplace_products(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_price ON marketplace_products(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_created ON marketplace_products(created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  payment_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_product ON marketplace_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);

CREATE TABLE IF NOT EXISTS marketplace_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_cart_user ON marketplace_cart(user_id);

-- ===================== CORPORATE TRAINING =====================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

CREATE TABLE IF NOT EXISTS corporate_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  curriculum JSONB,
  price DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  is_free BOOLEAN DEFAULT false,
  duration_days INTEGER,
  max_participants INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_corporate_trainings_org ON corporate_trainings(organization_id);
CREATE INDEX IF NOT EXISTS idx_corporate_trainings_creator ON corporate_trainings(created_by);
CREATE INDEX IF NOT EXISTS idx_corporate_trainings_slug ON corporate_trainings(slug);
CREATE INDEX IF NOT EXISTS idx_corporate_trainings_status ON corporate_trainings(status);

CREATE TABLE IF NOT EXISTS corporate_training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES corporate_trainings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  enrolled_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  completion_percentage INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(training_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cte_training ON corporate_training_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_cte_user ON corporate_training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_cte_org ON corporate_training_enrollments(organization_id);

-- ===================== AFFILIATE =====================

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  ref_code VARCHAR(50) NOT NULL UNIQUE,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  earnings DECIMAL(12, 2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  payout_threshold DECIMAL(10, 2) DEFAULT 5000,
  payout_account JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_ref_code ON affiliates(ref_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ref_code VARCHAR(50) NOT NULL,
  click_source VARCHAR(100),
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_ref_code ON affiliate_clicks(ref_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created ON affiliate_clicks(created_at DESC);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ref_code VARCHAR(50) NOT NULL,
  order_id UUID REFERENCES marketplace_orders(id),
  order_amount DECIMAL(10, 2),
  commission_amount DECIMAL(10, 2),
  payout_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_order ON affiliate_conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_payout ON affiliate_conversions(payout_status);

-- ===================== ADVERTISING =====================

CREATE TABLE IF NOT EXISTS ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slot_type VARCHAR(50) NOT NULL,
  width INTEGER,
  height INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_slot ON ad_placements(slot_type);
CREATE INDEX IF NOT EXISTS idx_ad_placements_active ON ad_placements(is_active);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  placement_id UUID REFERENCES ad_placements(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) DEFAULT 'banner',
  budget DECIMAL(12, 2) DEFAULT 0,
  bids_per_click DECIMAL(10, 2),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  creative_url TEXT,
  target_audience JSONB,
  priority INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement ON ad_campaigns(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placement_id UUID REFERENCES ad_placements(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created ON ad_impressions(created_at DESC);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user ON ad_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created ON ad_clicks(created_at DESC);

-- ===================== VIEWS =====================

CREATE OR REPLACE VIEW v_marketplace_product_stats AS
SELECT
  mp.id,
  mp.title,
  mp.slug,
  mp.price,
  mp.sales_count,
  COUNT(mo.id) AS order_count,
  COALESCE(SUM(mo.amount), 0) AS total_revenue
FROM marketplace_products mp
LEFT JOIN marketplace_orders mo ON mp.id = mo.product_id AND mo.status = 'completed'
GROUP BY mp.id;
