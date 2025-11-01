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
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    // ✅ FIXED: Map userId to id for consistency
    req.user = {
      id: userPayload.userId,  // ⭐ Your JWT uses 'userId', we map it to 'id'
      role: userPayload.role,
      email: userPayload.email
    };

    console.log('[Auth] User authenticated:', { id: req.user.id, role: req.user.role });
    
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
