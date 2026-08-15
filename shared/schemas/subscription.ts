import { z } from 'zod';
import { SUBSCRIPTION_STATUSES } from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableNumberSchema,
  recordSchema,
  arrayOf,
} from './common';

export const BillingCycleSchema = z.enum(['monthly', 'yearly', 'one_time']);
export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);

export const SubscriptionPlanSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalStringSchema,
  price: z.number().min(0),
  currency: z.string().min(1),
  billingCycle: BillingCycleSchema,
  durationDays: z.number().int().min(0),
  trialDays: nullableNumberSchema,
  features: arrayOf(z.string()),
  limits: recordSchema,
  isActive: z.boolean(),
  isPopular: z.boolean(),
  displayOrder: z.number().int().min(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const SubscriptionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  planId: idSchema,
  planName: optionalStringSchema,
  planCode: optionalStringSchema,
  gatewaySubscriptionId: optionalStringSchema,
  gateway: z.string().min(1),
  status: SubscriptionStatusSchema,
  currentPeriodStart: isoStringSchema,
  currentPeriodEnd: isoStringSchema,
  cancelAtPeriodEnd: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const InvoiceSchema = z.object({
  id: idSchema,
  invoiceNumber: z.string().min(1),
  userId: idSchema,
  subscriptionId: optionalStringSchema,
  paymentId: optionalStringSchema,
  amount: z.number().min(0),
  currency: z.string().min(1),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  dueDate: isoStringSchema,
  paidAt: optionalStringSchema,
  createdAt: isoStringSchema,
});

export const CouponSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  name: z.string().min(1),
  description: optionalStringSchema,
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  maxDiscountAmount: nullableNumberSchema,
  minPurchaseAmount: nullableNumberSchema,
  usageLimit: z.number().int().min(0),
  timesUsed: z.number().int().min(0),
  validFrom: isoStringSchema,
  validUntil: optionalStringSchema,
  applicablePlans: arrayOf(z.string()),
  isSingleUse: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
});

export const WalletSchema = z.object({
  id: idSchema,
  userId: idSchema,
  balance: z.number().min(0),
  currency: z.string().min(1),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const WalletTransactionSchema = z.object({
  id: idSchema,
  walletId: idSchema,
  type: z.enum(['credit', 'debit']),
  amount: z.number().min(0),
  balanceBefore: z.number().min(0),
  balanceAfter: z.number().min(0),
  reference: z.string().min(1),
  description: z.string().min(1),
  createdAt: isoStringSchema,
});

export const CreateSubscriptionPlanSchema = SubscriptionPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateSubscriptionSchema = SubscriptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSubscriptionPlanSchema = CreateSubscriptionPlanSchema.partial();
export const UpdateSubscriptionSchema = CreateSubscriptionSchema.partial();

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type Wallet = z.infer<typeof WalletSchema>;
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
export type CreateSubscriptionPlan = z.infer<typeof CreateSubscriptionPlanSchema>;
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionPlan = z.infer<typeof UpdateSubscriptionPlanSchema>;
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;
