export type PaymentGateway = 'paystack' | 'flutterwave' | 'stripe' | 'wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentPurpose = 'subscription' | 'course' | 'exam_package' | 'single_purchase' | 'topup';

export interface Payment {
  id: string;
  reference: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayReference?: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  purposeId?: string;
  metadata: Record<string, unknown>;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  paymentId?: string;
  walletId?: string;
  userId: string;
  type: 'credit' | 'debit' | 'refund' | 'topup' | 'purchase';
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  subscriptionId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: string;
  paidAt?: string;
  issuedAt?: string;
  expiresAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minPurchaseAmount?: number;
  usageLimit: number;
  timesUsed: number;
  validFrom: string;
  validUntil?: string;
  applicablePlans: string[];
  isSingleUse: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly' | 'once';
  durationDays: number;
  trialDays?: number;
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  gatewaySubscriptionId?: string;
  gateway: PaymentGateway;
  status: 'trialing' | 'active' | 'paused' | 'canceled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  cancellationReason?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}
