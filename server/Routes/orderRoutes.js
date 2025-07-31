import express from 'express';
import { getOrders, updateOrderStatus, createOrder, getMyOrders, getOrderById, getPaymentHistory } from '../controllers/orderController.js';
import { authenticateUser, isAdmin } from '../middleware/authorizedUser.js';

const router = express.Router();

router.post('/', authenticateUser, createOrder);
router.get('/myorders', authenticateUser, getMyOrders);
router.get('/payment-history', authenticateUser, getPaymentHistory);
router.get('/', authenticateUser, isAdmin, getOrders);
router.get('/:id', authenticateUser, isAdmin, getOrderById);
router.put('/:id', authenticateUser, isAdmin, updateOrderStatus);


export default router;