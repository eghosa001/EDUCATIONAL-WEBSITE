-- Phase 4: Monetization - Subscription & Payment Tables

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'NGN',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    duration_days INTEGER NOT NULL DEFAULT 30,
    trial_days INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    stripe_price_id VARCHAR(255),
    paystack_plan_code VARCHAR(255),
    flutterwave_plan_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    gateway_subscription_id VARCHAR(255),
    gateway VARCHAR(20) DEFAULT 'wallet',
    status VARCHAR(20) DEFAULT 'trialing',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    gateway VARCHAR(20) NOT NULL,
    gateway_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    purpose VARCHAR(50) NOT NULL,
    purpose_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- ============================================
-- PAYMENT METHODS / WALLET
-- ============================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- ============================================
-- PAYMENT METHOD TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    gateway VARCHAR(20) NOT NULL,
    gateway_token VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    last_four VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, gateway, gateway_token)
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- ============================================
-- COUPONS
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(12,2) NOT NULL,
    max_discount_amount DECIMAL(12,2),
    min_purchase_amount DECIMAL(12,2) DEFAULT 0,
    usage_limit INTEGER DEFAULT -1,
    times_used INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    applicable_plans JSONB DEFAULT '[]'::jsonb,
    is_single_use BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);

-- ============================================
-- COUPON USAGE
-- ============================================

CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    discount_applied DECIMAL(12,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)
);

CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);

-- ============================================
-- INITIAL SEED DATA
-- ============================================

INSERT INTO subscription_plans (name, code, description, price, billing_cycle, duration_days, features, limits, display_order, is_popular) VALUES
('Free', 'free', 'Basic access to free courses and content', 0, 'monthly', 30,
 '["Browse free courses", "Access free lessons", "Take practice quizzes", "Community forum access"]'::jsonb,
 '{"coursesPerMonth": -1, "examsPerMonth": 5, "aiQuestionsPerMonth": 10, "downloadsPerMonth": 5}'::jsonb,
 0, FALSE),

('Student Basic', 'student_basic', 'Affordable plan for primary and junior secondary students', 2500, 'monthly', 30,
 '["All free features", "Full curriculum courses", "Practice quizzes", "Download study materials", "AI tutor (basic)", "Progress tracking"]'::jsonb,
 '{"coursesPerMonth": -1, "examsPerMonth": 20, "aiQuestionsPerMonth": 50, "downloadsPerMonth": 30, "liveClassesPerMonth": 5}'::jsonb,
 1, FALSE),

('Student Premium', 'student_premium', 'Complete learning experience with unlimited access', 5000, 'monthly', 30,
 '["All basic features", "Unlimited AI tutor", "Past questions library", "Mock examinations", "Performance analytics", "Certificate of completion", "Priority support"]'::jsonb,
 '{"coursesPerMonth": -1, "examsPerMonth": -1, "aiQuestionsPerMonth": -1, "downloadsPerMonth": -1, "liveClassesPerMonth": 10}'::jsonb,
 2, TRUE),

('Parent', 'parent', 'Monitor and manage your childrens learning', 8000, 'monthly', 30,
 '["All premium features for one child", "Multiple child profiles (up to 3)", "Parent dashboard", "Study time reports", "Progress notifications", "Result alerts"]'::jsonb,
 '{"childrenCount": 3, "coursesPerMonth": -1, "examsPerMonth": -1, "aiQuestionsPerMonth": -1, "downloadsPerMonth": -1}'::jsonb,
 3, FALSE),

('Teacher', 'teacher', 'Create and monetize your courses', 10000, 'monthly', 30,
 '["Create unlimited courses", "Upload lessons and resources", "Create quizzes and exams", "Track student performance", "Earn from course sales", "Teacher analytics", "Revenue dashboard"]'::jsonb,
 '{"coursesPerMonth": -1, "studentsPerCourse": 500, "lessonUploadLimitPerMonth": 50}'::jsonb,
 4, FALSE),

('School', 'school', 'Full school management with learning platform', 50000, 'monthly', 30,
 '["All teacher features", "School administration", "Student management", "Class scheduling", "Exam management", "Results reporting", "Bulk subscriptions", "Dedicated support"]'::jsonb,
 '{"maxStudents": 500, "maxTeachers": 50, "schoolsPerAccount": 1}'::jsonb,
 5, FALSE);
