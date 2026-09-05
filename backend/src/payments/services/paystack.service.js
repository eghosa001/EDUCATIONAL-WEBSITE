import crypto from 'node:crypto';
import { config } from '../../common/config/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const paystackService = {
  async initializePayment({ amount, currency, email, reference, metadata = {} }) {
    const secretKey = config.payments.paystack.secretKey;
    if (!secretKey) throw new AppError('Paystack secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency, email, reference, metadata, callback_url: process.env.FRONTEND_URL || undefined }),
    });
    const data = await response.json();
    if (!data.status) throw new AppError(data.message || 'Failed to initialize payment', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    return { status: 'success', reference: data.data.reference, authorizationUrl: data.data.authorization_url, access_code: data.data.access_code, accessCode: data.data.access_code, transactionReference: data.data.reference };
  },

  async verifyPayment(reference) {
    const secretKey = config.payments.paystack.secretKey;
    if (!secretKey) throw new AppError('Paystack secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' } });
    const data = await response.json();
    if (!data.status) return null;
    return { status: data.data.status, reference: data.data.reference, amount: data.data.amount / 100, currency: data.data.currency, transactionReference: data.data.reference, gatewayResponse: data.data };
  },

  async refundPayment(gatewayReference, amount) {
    const secretKey = config.payments.paystack.secretKey;
    if (!secretKey) throw new AppError('Paystack secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, { method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction: gatewayReference, amount: Math.round(amount * 100) }) });
    const data = await response.json();
    if (!data.status) throw new AppError(data.message || 'Refund failed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    return { status: 'success', amount, gatewayReference: data.data?.id };
  },

  async handleWebhook(req) {
    const signature = req.headers['x-paystack-signature'];
    const secret = config.payments.paystack.webhookSecret;
    if (!signature || !secret || !req.rawBody) throw new AppError('Invalid webhook authentication', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHENTICATION_ERROR);
    const expected = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new AppError('Invalid webhook signature', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHENTICATION_ERROR);
    return req.body;
  },
};
