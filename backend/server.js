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
app.use(cors({
    origin: 'https://campus-bites-web.vercel.app', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json()); 

// ⭐ Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: 'https://campus-bites-web.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected clients
global.io = io;
global.connectedClients = new Map();

// ⭐ Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// ⭐ Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] ✅ User ${socket.userId} (${socket.userRole}) connected: ${socket.id}`);
  
  // Store client reference
  global.connectedClients.set(socket.userId, socket);

  // Join user to their personal room
  socket.join(`user-${socket.userId}`);

  // ⭐ Handle store status update from vendor
  socket.on('update-store-status', async (data) => {
    if (socket.userRole !== 'VENDOR') {
      return socket.emit('error', { message: 'Only vendors can update store status' });
    }

    try {
      // Broadcast to all clients
      io.emit('store-status', {
        isOpen: data.isOpen,
        timestamp: new Date().toISOString()
      });

      console.log(`[Socket] 🏪 Store status updated to ${data.isOpen} by vendor ${socket.userId}`);
    } catch (error) {
      console.error('[Socket] Error updating store status:', error);
      socket.emit('error', { message: 'Failed to update store status' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] ❌ User ${socket.userId} disconnected`);
    global.connectedClients.delete(socket.userId);
  });
});

// ⭐ Helper function to emit to specific user
global.emitToUser = (userId, event, data) => {
  const userSocket = global.connectedClients.get(userId);
  if (userSocket) {
    userSocket.emit(event, data);
    console.log(`[Socket] 📤 Sent '${event}' to user ${userId}`);
    return true;
  }
  console.log(`[Socket] ⚠️ User ${userId} not connected`);
  return false;
};

// ⭐ Helper function to broadcast to all clients
global.broadcastToAll = (event, data) => {
  io.emit(event, data);
  console.log(`[Socket] 📡 Broadcasted '${event}' to all clients`);
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`🏪 Store status endpoint: http://localhost:${PORT}/api/store/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});