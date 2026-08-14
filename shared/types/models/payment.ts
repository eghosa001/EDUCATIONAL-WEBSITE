export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export type PaymentGateway = 'flutterwave' | 'paystack' | 'stripe' | 'bank_transfer' | 'wallet';

export interface Payment {
  id: string;
  userId: string;
  reference: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayReference?: string;
  metadata: Record<string, unknown>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  paymentId?: string;
  type: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}
