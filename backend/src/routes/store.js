const express = require('express');
const router = express.Router();
const { getStoreStatus, updateStoreStatus } = require('../controllers/storeController');
const { authenticateToken, checkVendorRole } = require('../middleware/auth');

// Public route - anyone can check store status
router.get('/status', getStoreStatus);

// Protected route - only vendors can update
router.post('/status', authenticateToken, checkVendorRole, updateStoreStatus);

module.exports = router;