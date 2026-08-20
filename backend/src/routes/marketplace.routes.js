import { Router } from 'express';
import {
  authMiddleware,
  requireRole,
  optionalAuthMiddleware,
  validateRequest,
} from '../common/middleware/index.js';
import * as marketplaceController from '../marketplace/controllers/marketplace.controller.js';

export const marketplaceRoutes = Router();

// Products (public + authenticated)
marketplaceRoutes.get('/', optionalAuthMiddleware, marketplaceController.listProducts);
marketplaceRoutes.get('/search', optionalAuthMiddleware, marketplaceController.listProducts);
marketplaceRoutes.get('/:id', optionalAuthMiddleware, marketplaceController.getProduct);
marketplaceRoutes.get('/slug/:slug', optionalAuthMiddleware, marketplaceController.getProductBySlug);
marketplaceRoutes.get('/:id/stats', optionalAuthMiddleware, marketplaceController.getProductStats);

marketplaceRoutes.post('/', authMiddleware, marketplaceController.createProduct);
marketplaceRoutes.patch('/:id', authMiddleware, marketplaceController.updateProduct);
marketplaceRoutes.delete('/:id', authMiddleware, marketplaceController.deleteProduct);

// Orders
marketplaceRoutes.post('/orders', authMiddleware, marketplaceController.createOrder);
marketplaceRoutes.get('/orders', authMiddleware, marketplaceController.listOrders);
marketplaceRoutes.get('/orders/:id', authMiddleware, marketplaceController.getOrder);
marketplaceRoutes.patch('/orders/:id/status', authMiddleware, marketplaceController.updateOrderStatus);
marketplaceRoutes.get('/orders/stats', authMiddleware, marketplaceController.getSellerStats);

// Cart
marketplaceRoutes.get('/cart', authMiddleware, marketplaceController.getCart);
marketplaceRoutes.post('/cart/items', authMiddleware, marketplaceController.addToCart);
marketplaceRoutes.patch('/cart/items/:id', authMiddleware, marketplaceController.updateCartItem);
marketplaceRoutes.delete('/cart/items/:id', authMiddleware, marketplaceController.removeFromCart);
marketplaceRoutes.delete('/cart', authMiddleware, marketplaceController.clearCart);
