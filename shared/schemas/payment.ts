import { z } from 'zod';
import {
  PAYMENT_GATEWAYS,
  PAYMENT_PURPOSES,
  PAYMENT_STATUSES,
  TRANSACTION_TYPES,
} from '../constants/enums';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  recordSchema,
} from './common';

export const PaymentGatewaySchema = z.enum(PAYMENT_GATEWAYS);
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const PaymentPurposeSchema = z.enum(PAYMENT_PURPOSES);
export const TransactionTypeSchema = z.enum(TRANSACTION_TYPES);

export const PaymentSchema = z.object({
  id: idSchema,
  reference: z.string().min(1),
  userId: idSchema,
  amount: z.number().min(0),
  currency: z.string().min(1),
  gateway: PaymentGatewaySchema,
  gatewayReference: optionalStringSchema,
  status: PaymentStatusSchema,
  purpose: PaymentPurposeSchema,
  purposeId: optionalStringSchema,
  metadata: recordSchema,
  paidAt: nullableStringSchema,
  failedAt: nullableStringSchema,
  failureReason: optionalStringSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const TransactionSchema = z.object({
  id: idSchema,
  paymentId: optionalStringSchema,
  walletId: optionalStringSchema,
  userId: idSchema,
  type: TransactionTypeSchema,
  amount: z.number().min(0),
  currency: z.string().min(1),
  balanceBefore: z.number().min(0),
  balanceAfter: z.number().min(0),
  reference: optionalStringSchema,
  description: optionalStringSchema,
  metadata: recordSchema,
  createdAt: isoStringSchema,
});

export const InvoiceStatusSchema = z.enum(['pending', 'paid', 'overdue', 'cancelled']);

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
  status: InvoiceStatusSchema,
  dueDate: nullableStringSchema,
  paidAt: nullableStringSchema,
  issuedAt: nullableStringSchema,
  expiresAt: nullableStringSchema,
  metadata: recordSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
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

export const DiscountTypeSchema = z.enum(['percentage', 'fixed']);

export const CouponSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  name: z.string().min(1),
  description: optionalStringSchema,
  discountType: DiscountTypeSchema,
  discountValue: z.number().min(0),
  maxDiscountAmount: nullableNumberSchema,
  minPurchaseAmount: nullableNumberSchema,
  usageLimit: z.number().int().min(0),
  timesUsed: z.number().int().min(0),
  validFrom: isoStringSchema,
  validUntil: nullableStringSchema,
  applicablePlans: z.array(z.string()).default([]),
  isSingleUse: z.boolean(),
  isActive: z.boolean(),
  createdBy: optionalStringSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const BillingCycleSchema = z.enum(['monthly', 'yearly', 'quarterly', 'once']);

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
  features: z.array(z.string()).default([]),
  limits: recordSchema,
  isActive: z.boolean(),
  isPopular: z.boolean(),
  displayOrder: z.number().int().min(0),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  status: true,
  paidAt: true,
  failedAt: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateTransactionSchema = TransactionSchema.omit({
  id: true,
  createdAt: true,
});

export const CreateWalletSchema = WalletSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateCouponSchema = CouponSchema.omit({
  id: true,
  timesUsed: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateSubscriptionPlanSchema = SubscriptionPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdatePaymentSchema = CreatePaymentSchema.partial();
export const UpdateWalletSchema = CreateWalletSchema.partial();
export const UpdateCouponSchema = CreateCouponSchema.partial();
export const UpdateSubscriptionPlanSchema = CreateSubscriptionPlanSchema.partial();

export type Payment = z.infer<typeof PaymentSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type Wallet = z.infer<typeof WalletSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type CreateWallet = z.infer<typeof CreateWalletSchema>;
export type CreateCoupon = z.infer<typeof CreateCouponSchema>;
export type CreateSubscriptionPlan = z.infer<typeof CreateSubscriptionPlanSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
export type UpdateWallet = z.infer<typeof UpdateWalletSchema>;
export type UpdateCoupon = z.infer<typeof UpdateCouponSchema>;
export type UpdateSubscriptionPlan = z.infer<typeof UpdateSubscriptionPlanSchema>;
