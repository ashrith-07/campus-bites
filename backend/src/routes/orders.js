const express = require('express');
const router = express.Router();
const { authenticateToken, checkVendorRole } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// Create order
router.post('/', authenticateToken, createOrder);

// Get all orders
router.get('/', authenticateToken, getAllOrders);

// Get order by ID
router.get('/:id', authenticateToken, getOrderById);

// Update order status (vendor only)
router.put('/:id', authenticateToken, checkVendorRole, updateOrderStatus);

// Delete order
router.delete('/:id', authenticateToken, deleteOrder);

module.exports = router;