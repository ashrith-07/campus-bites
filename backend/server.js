const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv'); 

const authRouter = require('./src/routes/auth'); 
const menuRouter = require('./src/routes/menu');
const orderRouter = require('./src/routes/orders');
const userRouter = require('./src/routes/users');
const uploadRouter = require('./src/routes/upload');
const storeRouter = require('./src/routes/store'); // ⭐ ADD THIS
const { router: notificationRoutes } = require('./src/routes/notifications');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; 

app.use(cors({
    origin: 'https://campus-bites-web.vercel.app', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json()); 

// ⭐ API Routes
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/store', storeRouter); // ⭐ ADD THIS
app.use('/api/notifications', notificationRoutes);

// ⭐ Enhanced status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Campus Bites API is running smoothly!', 
    service: 'Backend',
    sseConnections: global.sseClients ? global.sseClients.size : 0,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/api/notifications/stream`);
  console.log(`🏪 Store status endpoint: http://localhost:${PORT}/api/store/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});