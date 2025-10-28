const express = require('express');
const jwt = require('jsonwebtoken');
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

const { validate } = require('../middleware/validate');
const { checkoutSchema, confirmOrderSchema, updateOrderStatusSchema } = require('../validations/schemas');

const router = express.Router();

// Middleware to authenticate token from query param (for SSE)
const authenticateSSE = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    // For SSE, send proper response and close
    res.status(401).set({
      'Content-Type': 'text/plain'
    }).send('Authentication required');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // For SSE, send proper response and close
    res.status(403).set({
      'Content-Type': 'text/plain'
    }).send('Invalid token');
    return;
  }
};

// Customer routes with validation
router.post('/checkout', authenticateToken, validate(checkoutSchema), initiateCheckout);
router.post('/confirm', authenticateToken, validate(confirmOrderSchema), confirmOrder);
router.get('/stream', authenticateSSE, connectToOrderStream);
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);

// Vendor routes with validation
router.put('/:id', authenticateToken, checkVendorRole, validate(updateOrderStatusSchema), updateOrder);

module.exports = router;