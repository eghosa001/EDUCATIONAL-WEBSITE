import { config } from '../../common/config/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export const flutterwaveService = {
  async initializePayment({ amount, currency, customerEmail, txRef, redirectUrl, metadata = {} }) {
    const secretKey = config.payments.flutterwave.secretKey;
    if (!secretKey) {
      throw new AppError('Flutterwave secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: parseFloat(amount),
        currency,
        customer_email: customerEmail,
        redirect_url: redirectUrl,
        customization: {
          title: 'Educational Platform Payment',
          description: 'Payment for educational content',
        },
        metadata,
      }),
    });

    const data = await response.json();

    if (!data.status === 'success') {
      throw new AppError(data.message || 'Failed to initialize payment', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    }

    return {
      status: 'success',
      reference: data.data?.tx_ref,
      link: data.data?.link,
      transactionReference: data.data?.tx_ref,
    };
  },

  async verifyPayment(txRef) {
    const secretKey = config.payments.flutterwave.secretKey;
    if (!secretKey) {
      throw new AppError('Flutterwave secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${txRef}/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status !== 'success') {
      return null;
    }

    return {
      status: data.data?.status?.toLowerCase(),
      reference: data.data?.tx_ref,
      amount: parseFloat(data.data?.amount),
      gatewayResponse: data.data,
    };
  },

  async refundPayment(transactionId, amount) {
    const secretKey = config.payments.flutterwave.secretKey;
    if (!secretKey) {
      throw new AppError('Flutterwave secret key not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.SERVICE_UNAVAILABLE);
    }

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_id: transactionId,
        amount: parseFloat(amount),
      }),
    });

    const data = await response.json();
    if (data.status !== 'success') {
      throw new AppError(data.message || 'Refund failed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR);
    }

    return {
      status: 'success',
      amount,
      gatewayReference: data.data?.id,
    };
  },

  async handleWebhook(req) {
    const payload = req.body;
    const secretHash = config.payments.flutterwave.encryptionKey;

    if (secretHash && payload.enCRYPTED_SECURITY_HASH !== secretHash) {
      throw new AppError('Invalid webhook signature', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    return payload;
  },
};
