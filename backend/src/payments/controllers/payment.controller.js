import {
  initializePayment,
  verifyPayment,
  refundPayment,
  getPaymentById,
  listPayments,
  getPaymentStats,
} from '../services/payment.service.js';
import { paymentModel } from '../models/payment.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { schemas } from '../../common/validators/joi.js';
import { validateRequest, authMiddleware, optionalAuthMiddleware, requireRole } from '../../common/middleware/index.js';
import { paystackService } from '../services/paystack.service.js';
import { flutterwaveService } from '../services/flutterwave.service.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const initializeNewPayment = async (req, res) => {
  const result = await initializePayment(req.user.id, req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Payment initialized',
    data: result.data,
  });
};

export const verifyNewPayment = async (req, res) => {
  const { reference } = req.body;
  const result = await verifyPayment(reference);
  res.json(result);
};

export const getPayment = async (req, res) => {
  const payment = await getPaymentById(req.params.id, req.user.id);
  res.json({ success: true, data: { payment } });
};

export const listAllPayments = async (req, res) => {
  const { page, limit, status, startDate, endDate } = req.query;
  const result = await listPayments({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    startDate,
    endDate,
  });
  res.json({ success: true, data: result });
};

export const getPaymentStatsHandler = async (req, res) => {
  const { userId } = req.query;
  const stats = await getPaymentStats(userId || null);
  res.json({ success: true, data: { stats } });
};

export const refundPaymentHandler = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await paymentModel.findById(id);
  if (!payment) notFound('Payment');
  if (payment.user_id !== req.user.id && !req.user.roles.includes('super_admin')) {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }

  const result = await refundPayment(id, req.user.id, reason);
  res.json({ success: true, message: 'Payment refunded', data: result });
};

export const handlePaystackWebhook = async (req, res) => {
  try {
    const event = await paystackService.handleWebhook(req);
    const { event: eventType, data } = event;

    if (eventType === 'charge.success') {
      const { reference } = data;
      const payment = await paymentModel.findByReference(reference);

      if (payment && payment.status === 'pending') {
        await paymentModel.update(payment.id, {
          status: 'completed',
          paidAt: new Date(),
          gatewayReference: data.transaction_reference || reference,
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: error.message });
  }
};

export const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const event = await flutterwaveService.handleWebhook(req);
    const { event_type, transaction } = event;

    if (event_type === 'complete') {
      const { tx_ref } = transaction;
      const payment = await paymentModel.findByReference(tx_ref);

      if (payment && payment.status === 'pending') {
        await paymentModel.update(payment.id, {
          status: 'completed',
          paidAt: new Date(),
          gatewayReference: transaction?.id?.toString(),
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: error.message });
  }
};

export const fetchPaymentGateways = async (req, res) => {
  const gateways = [
    { id: '1', name: 'Paystack', code: 'paystack', isActive: !!process.env.PAYSTACK_SECRET_KEY },
    { id: '2', name: 'Flutterwave', code: 'flutterwave', isActive: !!process.env.FLUTTERWAVE_SECRET_KEY },
    { id: '3', name: 'Wallet', code: 'wallet', isActive: true },
  ];
  res.json({ success: true, data: { gateways } });
};
