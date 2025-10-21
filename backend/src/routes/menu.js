const express = require('express');
const { 
  getAllMenuItems, 
  getMenuItemById, 
  createMenuItem,
  updateMenuItem, 
  deleteMenuItem  
} = require('../controllers/menuController');

const { 
  authenticateToken, 
  checkVendorRole 
} = require('../middleware/auth'); 

const router = express.Router(); 


router.get('/items', getAllMenuItems);
router.get('/items/:id', getMenuItemById);


router.post(
  '/items', 
  authenticateToken, 
  checkVendorRole, 
  createMenuItem
);


router.put(
  '/items/:id', 
  authenticateToken, 
  checkVendorRole, 
  updateMenuItem
);


router.delete(
  '/items/:id', 
  authenticateToken, 
  checkVendorRole, 
  deleteMenuItem
);


module.exports = router;