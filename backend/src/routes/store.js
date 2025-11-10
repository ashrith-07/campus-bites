const express = require('express');
const router = express.Router();
const { getStoreStatus, updateStoreStatus } = require('../controllers/storeController');
const { authenticateToken, checkVendorRole } = require('../middleware/auth');


router.get('/status', getStoreStatus);


router.post('/status', authenticateToken, checkVendorRole, updateStoreStatus);

module.exports = router;