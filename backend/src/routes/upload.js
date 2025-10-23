const express = require('express');
const { 
    authenticateToken, 
    checkVendorRole 
} = require('../middleware/auth'); 
const { upload, uploadImage } = require('../controllers/uploadController');

const router = express.Router(); 


router.post(
  '/image', 
  authenticateToken, 
  checkVendorRole, 
  upload, 
  uploadImage
);

module.exports = router;