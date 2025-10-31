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

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getAllOrders);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id', authenticateToken, checkVendorRole, updateOrderStatus);
router.delete('/:id', authenticateToken, deleteOrder);

module.exports = router;