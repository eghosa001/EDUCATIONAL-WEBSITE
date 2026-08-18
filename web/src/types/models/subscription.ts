export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  durationDays: number;
  trialDays?: number;
  features: string[];
  limits: Record<string, unknown>;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing' | 'paused';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName?: string;
  planCode?: string;
  gatewaySubscriptionId?: string;
  gateway: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
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
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  dueDate: string;
  paidAt?: string;
  createdAt: string;
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
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
  date: string;
  description?: string;
}
