import { config } from '../../common/config/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const paystackService = {
  async initializePayment({ amount, currency, email, reference, metadata = {} }) {
    const secretKey = config.payments.paystack.secretKey;
    if (!secretKey) {
      throw new AppError('Paystack secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        email,
        reference,
        metadata,
        callback_url: config.payments.paystack.webhookSecret
          ? `${config.apiPrefix}/payments/webhook/paystack`
          : undefined,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new AppError(data.message || 'Failed to initialize payment', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    }

    return {
      status: 'success',
      reference: data.data.reference,
      authorizationUrl: data.data.authorization_url,
      access_code: data.data.access_code,
      transactionReference: data.data.reference,
    };
  },

  async verifyPayment(reference) {
    const secretKey = config.payments.paystack.secretKey;
    if (!secretKey) {
      throw new AppError('Paystack secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.status) {
      return null;
    }

    return {
      status: data.data.status,
      reference: data.data.reference,
      amount: data.data.amount / 100,
      gatewayResponse: data.data,
    };
  },

  async refundPayment(gatewayReference, amount) {
    const secretKey = config.payments.paystack.secretKey;
    if (!secretKey) {
      throw new AppError('Paystack secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: gatewayReference,
        amount: Math.round(amount * 100),
      }),
    });

    const data = await response.json();
    if (!data.status) {
      throw new AppError(data.message || 'Refund failed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    }

    return {
      status: 'success',
      amount,
      gatewayReference: data.data?.id,
    };
  },

  async handleWebhook(req) {
    const signature = req.headers['x-paystack-signature'];
    const payload = req.body;

    if (signature) {
      const crypto = await import('crypto');
      const secret = config.payments.paystack.webhookSecret;
      if (!secret) {
        throw new AppError('Paystack webhook secret not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
      }
      const hmac = crypto.createHmac('sha512', secret);
      const digest = hmac.update(JSON.stringify(payload)).digest('hex');
      if (digest !== signature) {
        throw new AppError('Invalid webhook signature', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHENTICATION_ERROR);
      }
    }

    return payload;
  },
};
