import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { marketplaceModel } from '../models/marketplace.model.js';
import { marketplaceOrderModel } from '../models/order.model.js';
import { cartModel } from '../models/cart.model.js';

export async function listProducts(req, res) {
  const { page, limit, search, category, minPrice, maxPrice, sellerId, status, sortBy, order } = req.query;
  const result = await marketplaceModel.list({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search, category, minPrice, maxPrice, sellerId, status, sortBy, order,
  });
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getProduct(req, res) {
  const product = await marketplaceModel.findById(req.params.id);
  if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  res.json({ success: true, data: product });
}

export async function getProductBySlug(req, res) {
  const product = await marketplaceModel.findBySlug(req.params.slug);
  if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  res.json({ success: true, data: product });
}

export async function createProduct(req, res) {
  const product = await marketplaceModel.create({ ...req.body, sellerId: req.user.id });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: product });
}

export async function updateProduct(req, res) {
  const product = await marketplaceModel.findById(req.params.id);
  if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  if (product.seller_id !== req.user.id && req.user.role !== 'super_admin') {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  const updated = await marketplaceModel.update(req.params.id, req.body);
  res.json({ success: true, data: updated });
}

export async function deleteProduct(req, res) {
  const product = await marketplaceModel.findById(req.params.id);
  if (!product) throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  if (product.seller_id !== req.user.id && req.user.role !== 'super_admin') {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  await marketplaceModel.delete(req.params.id);
  res.json({ success: true, message: 'Product deleted' });
}

export async function getProductStats(req, res) {
  const stats = await marketplaceModel.getStats(req.params.id);
  res.json({ success: true, data: stats });
}

export async function createOrder(req, res) {
  const order = await marketplaceOrderModel.create({
    buyerId: req.user.id,
    ...req.body,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: order });
}

export async function getOrder(req, res) {
  const order = await marketplaceOrderModel.findById(req.params.id);
  if (!order) throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'super_admin') {
    throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  res.json({ success: true, data: order });
}

export async function listOrders(req, res) {
  const { page, limit, buyerId, sellerId, status, productId } = req.query;
  const result = await marketplaceOrderModel.list({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    buyerId: buyerId || req.user.id,
    sellerId,
    status,
    productId,
  });
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const order = await marketplaceOrderModel.findById(req.params.id);
  if (!order) throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  const updated = await marketplaceOrderModel.updateStatus(req.params.id, status);
  res.json({ success: true, data: updated });
}

export async function getSellerStats(req, res) {
  const stats = await marketplaceOrderModel.getStats(req.user.id);
  res.json({ success: true, data: stats });
}

export async function addToCart(req, res) {
  const item = await cartModel.addItem({
    userId: req.user.id,
    productId: req.body.productId,
    quantity: req.body.quantity || 1,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: item });
}

export async function getCart(req, res) {
  const cart = await cartModel.getCartSummary(req.user.id);
  res.json({ success: true, data: cart });
}

export async function updateCartItem(req, res) {
  const item = await cartModel.updateQuantity(req.params.id, req.body.quantity);
  res.json({ success: true, data: item });
}

export async function removeFromCart(req, res) {
  await cartModel.removeItem(req.params.id);
  res.json({ success: true, message: 'Item removed from cart' });
}

export async function clearCart(req, res) {
  await cartModel.clearCart(req.user.id);
  res.json({ success: true, message: 'Cart cleared' });
}
