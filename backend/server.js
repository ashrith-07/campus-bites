const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); 
const dotenv = require('dotenv'); 
const jwt = require('jsonwebtoken');

const authRouter = require('./src/routes/auth'); 
const menuRouter = require('./src/routes/menu');
const orderRouter = require('./src/routes/orders');
const userRouter = require('./src/routes/users');
const uploadRouter = require('./src/routes/upload');
const storeRouter = require('./src/routes/store');

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;

// ⭐ CORS configuration
const allowedOrigins = [
  'https://campus-bites-web.vercel.app',
  'https://campus-bites-server.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.error('[CORS] Blocked origin:', origin);
      return callback(new Error('CORS policy violation'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 

// ⭐ Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
  perMessageDeflate: false
});

// Store connected clients
global.io = io;
global.connectedClients = new Map();

// ⭐ Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  console.log('[Socket] 🔐 Auth attempt from:', socket.handshake.address);
  
  if (!token) {
    console.error('[Socket] ❌ No token provided');
    return next(new Error('Authentication error: No token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ⭐ CRITICAL: Use 'id' not 'userId' to match your JWT payload
    socket.userId = decoded.id || decoded.userId; // Try both for compatibility
    socket.userEmail = decoded.email;
    socket.userRole = decoded.role;
    
    console.log('[Socket] ✅ Auth successful:', {
      userId: socket.userId,
      email: socket.userEmail,
      role: socket.userRole
    });
    
    next();
  } catch (error) {
    console.error('[Socket] ❌ Token verification failed:', error.message);
    next(new Error('Invalid token'));
  }
});

// ⭐ Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] ✅ User connected:`, {
    socketId: socket.id,
    userId: socket.userId,
    email: socket.userEmail,
    role: socket.userRole,
    transport: socket.conn.transport.name
  });
  
  // Store client reference
  global.connectedClients.set(socket.userId, socket);
  console.log(`[Socket] 👥 Total connected clients: ${global.connectedClients.size}`);

  // Join user to their personal room
  socket.join(`user-${socket.userId}`);
  
  // Send welcome message
  socket.emit('connection-success', {
    message: 'Connected to Campus Bites',
    userId: socket.userId,
    role: socket.userRole
  });

  // ⭐ Handle store status update from vendor
  socket.on('update-store-status', async (data) => {
    console.log(`[Socket] 🏪 Store status update request from user ${socket.userId} (${socket.userRole})`);
    
    if (socket.userRole !== 'VENDOR') {
      console.error(`[Socket] ❌ Unauthorized: User ${socket.userId} is not a vendor`);
      return socket.emit('error', { message: 'Only vendors can update store status' });
    }

    try {
      // Broadcast to all clients
      io.emit('store-status', {
        isOpen: data.isOpen,
        timestamp: new Date().toISOString()
      });

      console.log(`[Socket] ✅ Store status broadcasted: ${data.isOpen ? 'OPEN' : 'CLOSED'}`);
    } catch (error) {
      console.error('[Socket] ❌ Error updating store status:', error);
      socket.emit('error', { message: 'Failed to update store status' });
    }
  });

  // ⭐ Transport upgrade event
  socket.conn.on('upgrade', (transport) => {
    console.log(`[Socket] ⬆️ User ${socket.userId} upgraded to ${transport.name}`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] ❌ User ${socket.userId} (${socket.userEmail}) disconnected:`, reason);
    global.connectedClients.delete(socket.userId);
    console.log(`[Socket] 👥 Total connected clients: ${global.connectedClients.size}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Socket] ⚠️ Socket error for user ${socket.userId}:`, error);
  });
});

// ⭐ Helper function to emit to specific user
global.emitToUser = (userId, event, data) => {
  console.log(`[Socket] 📤 Attempting to emit '${event}' to user ${userId}...`);
  
  const userSocket = global.connectedClients.get(userId);
  
  if (userSocket) {
    userSocket.emit(event, data);
    console.log(`[Socket] ✅ Successfully sent '${event}' to user ${userId}:`, data);
    return true;
  }
  
  // Also try room-based emission as fallback
  io.to(`user-${userId}`).emit(event, data);
  console.log(`[Socket] ⚠️ User ${userId} not in connectedClients, tried room emission`);
  return false;
};

// ⭐ Helper function to broadcast to all clients
global.broadcastToAll = (event, data) => {
  io.emit(event, data);
  console.log(`[Socket] 📡 Broadcasted '${event}' to all ${global.connectedClients.size} clients:`, data);
};

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/store', storeRouter);

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Campus Bites API is running smoothly!', 
    service: 'Backend',
    socketConnections: global.connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

// ⭐ Debug endpoint to check connected clients
app.get('/api/socket/clients', (req, res) => {
  const clients = Array.from(global.connectedClients.keys());
  res.json({
    total: clients.length,
    userIds: clients
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`🏪 Store status endpoint: http://localhost:${PORT}/api/store/status`);
  console.log(`🔍 Socket clients endpoint: http://localhost:${PORT}/api/socket/clients`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});