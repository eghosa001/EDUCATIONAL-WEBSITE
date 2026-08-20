import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { marketplaceModel } from '../models/marketplace.model.js';
import { marketplaceOrderModel } from '../models/order.model.js';
import { cartModel } from '../models/cart.model.js';
import { PAYMENT_STATUS } from '../../common/constants/index.js';

export const marketplaceService = {
  async listProducts(params) {
    return await marketplaceModel.list(params);
  },

  async getProduct(id) {
    const product = await marketplaceModel.findById(id);
    if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return product;
  },

  async getProductBySlug(slug) {
    const product = await marketplaceModel.findBySlug(slug);
    if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return product;
  },

  async createProduct(data) {
    return await marketplaceModel.create(data);
  },

  async updateProduct(id, data) {
    const product = await marketplaceModel.findById(id);
    if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await marketplaceModel.update(id, data);
  },

  async deleteProduct(id) {
    const product = await marketplaceModel.findById(id);
    if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await marketplaceModel.delete(id);
  },

  async getProductStats(productId) {
    return await marketplaceModel.getStats(productId);
  },

  // Order operations
  async createOrder(data) {
    const { buyerId, sellerId, productId, amount, currency } = data;

    const product = await marketplaceModel.findById(productId);
    if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

    const order = await marketplaceOrderModel.create({
      buyerId,
      sellerId: product.seller_id,
      productId,
      amount: amount || product.price,
      currency: currency || product.currency || 'NGN',
      status: PAYMENT_STATUS.PENDING,
    });

    return order;
  },

  async getOrder(id) {
    const order = await marketplaceOrderModel.findById(id);
    if (!order) throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return order;
  },

  async listOrders(params) {
    return await marketplaceOrderModel.list(params);
  },

  async updateOrderStatus(orderId, status) {
    const order = await marketplaceOrderModel.findById(orderId);
    if (!order) throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

    const updated = await marketplaceOrderModel.updateStatus(orderId, status);

    if (status === 'completed') {
      await marketplaceModel.incrementSalesCount(order.product_id);
    }

    return updated;
  },

  async getBuyerOrders(userId, params = {}) {
    return await marketplaceOrderModel.getBuyerOrders(userId, params);
  },

  async getSellerOrders(userId, params = {}) {
    return await marketplaceOrderModel.getSellerOrders(userId, params);
  },

  async getSellerStats(userId) {
    return await marketplaceOrderModel.getStats(userId);
  },

  // Cart operations
  async addToCart(userId, productId, quantity = 1) {
    const product = await marketplaceModel.findById(productId);
    if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await cartModel.addItem({ userId, productId: productId, quantity });
  },

  async getCart(userId) {
    return await cartModel.getCartSummary(userId);
  },

  async updateCartItem(cartItemId, quantity) {
    const item = await cartModel.findById(cartItemId);
    if (!item) throw new AppError('Cart item not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return await cartModel.updateQuantity(cartItemId, quantity);
  },

  async removeFromCart(cartItemId) {
    return await cartModel.removeItem(cartItemId);
  },

  async clearCart(userId) {
    return await cartModel.clearCart(userId);
  },
};
