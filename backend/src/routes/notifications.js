const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Global store for SSE clients and store status
if (!global.sseClients) {
  global.sseClients = new Map();
}
if (typeof global.storeStatus === 'undefined') {
  global.storeStatus = true; // Store is open by default
}

/**
 * Middleware to authenticate token from query parameter
 * (EventSource doesn't support custom headers)
 */
const authenticateSSE = (req, res, next) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * SSE Stream Endpoint
 * GET /api/notifications/stream?token=JWT_TOKEN
 * Establishes SSE connection for real-time notifications
 */
router.get('/stream', authenticateSSE, (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  const userId = req.user.id;
  const userRole = req.user.role;

  console.log(`[SSE] New connection from user ${userId} (${userRole})`);

  // Send initial connection confirmation with store status
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    message: 'Connected to notification stream',
    userId,
    isOpen: global.storeStatus
  })}\n\n`);

  // Store client connection with user info
  global.sseClients.set(userId, { 
    response: res, 
    role: userRole,
    connectedAt: new Date()
  });

  console.log(`[SSE] Active connections: ${global.sseClients.size}`);

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Every 30 seconds

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[SSE] User ${userId} disconnected`);
    clearInterval(heartbeatInterval);
    global.sseClients.delete(userId);
    console.log(`[SSE] Active connections: ${global.sseClients.size}`);
  });
});

/**
 * Store Status Update Endpoint
 * POST /api/notifications/store-status
 * Allows vendors to open/close the store and broadcast to all clients
 */
router.post('/store-status', authenticateSSE, (req, res) => {
  const { isOpen } = req.body;

  // Check if user is vendor
  if (req.user.role !== 'VENDOR') {
    return res.status(403).json({ error: 'Only vendors can update store status' });
  }

  if (typeof isOpen !== 'boolean') {
    return res.status(400).json({ error: 'isOpen must be a boolean value' });
  }

  // Update global store status
  const previousStatus = global.storeStatus;
  global.storeStatus = isOpen;

  console.log(`[Store Status] Changed from ${previousStatus} to ${isOpen} by vendor ${req.user.id}`);

  // Broadcast to all connected clients
  let broadcastCount = 0;
  global.sseClients.forEach((client, userId) => {
    try {
      client.response.write(`event: store-status\ndata: ${JSON.stringify({ 
        type: 'store-status', 
        isOpen,
        timestamp: new Date().toISOString()
      })}\n\n`);
      broadcastCount++;
    } catch (error) {
      console.error(`[SSE] Failed to send to user ${userId}:`, error.message);
      // Remove dead connections
      global.sseClients.delete(userId);
    }
  });

  console.log(`[Store Status] Broadcasted to ${broadcastCount} clients`);

  res.json({ 
    success: true, 
    isOpen,
    broadcastedTo: broadcastCount,
    activeConnections: global.sseClients.size
  });
});

/**
 * Broadcast Order Update to Specific User
 * Helper function to be used by order controller
 */
function broadcastOrderUpdate(userId, orderId, status, message) {
  const client = global.sseClients.get(userId);
  
  if (client) {
    try {
      client.response.write(`event: order-update\ndata: ${JSON.stringify({
        type: 'order-update',
        orderId,
        status,
        message,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      console.log(`[Order Update] Sent notification to user ${userId} for order ${orderId}`);
      return true;
    } catch (error) {
      console.error(`[Order Update] Failed to send to user ${userId}:`, error.message);
      global.sseClients.delete(userId);
      return false;
    }
  } else {
    console.log(`[Order Update] User ${userId} not connected to SSE`);
    return false;
  }
}

/**
 * Get SSE Stats (for debugging/monitoring)
 * GET /api/notifications/stats
 */
router.get('/stats', authenticateSSE, (req, res) => {
  // Only vendors can see stats
  if (req.user.role !== 'VENDOR') {
    return res.status(403).json({ error: 'Only vendors can view stats' });
  }

  const stats = {
    activeConnections: global.sseClients.size,
    storeStatus: global.storeStatus,
    clients: Array.from(global.sseClients.entries()).map(([userId, client]) => ({
      userId,
      role: client.role,
      connectedAt: client.connectedAt
    }))
  };

  res.json(stats);
});

module.exports = { 
  router, 
  broadcastOrderUpdate 
};