const express = require('express');
const { 
  initiateCheckout,
  confirmOrder,
  getOrders,
  getOrderById,
  updateOrder,
  connectToOrderStream 
} = require('../controllers/orderController');

const { 
  authenticateToken, 
  checkVendorRole 
} = require('../middleware/auth'); 

const router = express.Router(); 

// Customer routes
router.post('/checkout', authenticateToken, initiateCheckout);
router.post('/confirm', authenticateToken, confirmOrder);
router.get('/stream', authenticateToken, connectToOrderStream);
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);

// Vendor routes
router.put('/:id', authenticateToken, checkVendorRole, updateOrder);

module.exports = router;