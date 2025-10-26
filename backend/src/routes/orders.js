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

const router = express.Router(); 

// Middleware to authenticate token from query param (for SSE)
const authenticateSSE = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Customer routes
router.post('/checkout', authenticateToken, initiateCheckout);
router.post('/confirm', authenticateToken, confirmOrder);
router.get('/stream', authenticateSSE, connectToOrderStream);
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);

// Vendor routes
router.put('/:id', authenticateToken, checkVendorRole, updateOrder);

module.exports = router;