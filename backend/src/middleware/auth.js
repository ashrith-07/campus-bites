const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
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