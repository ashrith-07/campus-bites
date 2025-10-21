const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
   
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    
  
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    req.user = userPayload; 
    
    next();
  });
};

const checkVendorRole = (req, res, next) => {
  
  if (!req.user) {
    return res.status(500).json({ error: 'Authentication data missing.' });
  }

  if (req.user.role !== 'VENDOR') {
    return res.status(403).json({ error: 'Forbidden. Access requires Vendor role.' });
  }

  next();
};

module.exports = {
  authenticateToken,
  checkVendorRole
};