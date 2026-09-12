import crypto from 'node:crypto';
import { config } from '../../common/config/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

const timingSafeStringEqual = (actual, expected) => {
  const a = Buffer.from(String(actual || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const flutterwaveService = {
  async initializePayment({ amount, currency, customerEmail, txRef, redirectUrl, metadata = {} }) {
    const secretKey = config.payments.flutterwave.secretKey;
    if (!secretKey) throw new AppError('Flutterwave secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref: txRef, amount: Number(amount), currency, customer_email: customerEmail, redirect_url: redirectUrl, customization: { title: 'Educational Platform Payment', description: 'Payment for educational content' }, metadata }),
    });
    const data = await response.json();
    if (data.status !== 'success' || !data.data?.link) throw new AppError(data.message || 'Failed to initialize payment', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    return { status: 'success', reference: data.data.tx_ref || txRef, link: data.data.link, authorizationUrl: data.data.link, transactionReference: data.data.tx_ref || txRef };
  },

  async verifyPayment(txRef) {
    const secretKey = config.payments.flutterwave.secretKey;
    if (!secretKey) throw new AppError('Flutterwave secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${encodeURIComponent(txRef)}/verify`, { method: 'GET', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' } });
    const data = await response.json();
    if (data.status !== 'success') return null;
    return { status: data.data?.status?.toLowerCase(), reference: data.data?.tx_ref || data.data?.reference, amount: Number(data.data?.amount), currency: data.data?.currency, transactionReference: data.data?.id?.toString(), gatewayResponse: data.data };
  },

  async refundPayment(transactionId, amount) {
    const secretKey = config.payments.flutterwave.secretKey;
    if (!secretKey) throw new AppError('Flutterwave secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/refunds`, { method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction_id: transactionId, amount: Number(amount) }) });
    const data = await response.json();
    if (data.status !== 'success') throw new AppError(data.message || 'Refund failed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    return { status: 'success', amount, gatewayReference: data.data?.id };
  },

  async handleWebhook(req) {
    const secretHash = config.payments.flutterwave.webhookSecret || config.payments.flutterwave.encryptionKey;
    if (!secretHash || !req.rawBody) throw new AppError('Invalid webhook authentication', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHENTICATION_ERROR);

    const modernSignature = req.headers['flutterwave-signature'];
    const legacySignature = req.headers['verif-hash'];
    let valid = false;
    if (typeof modernSignature === 'string') {
      const expected = crypto.createHmac('sha256', secretHash).update(req.rawBody).digest('base64');
      valid = timingSafeStringEqual(modernSignature, expected);
    } else if (typeof legacySignature === 'string') {
      valid = timingSafeStringEqual(legacySignature, secretHash);
    }
    if (!valid) throw new AppError('Invalid webhook signature', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHENTICATION_ERROR);
    return req.body;
  },
};
