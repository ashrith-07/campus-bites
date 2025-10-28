const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv'); 


const authRouter = require('./src/routes/auth'); 
const menuRouter = require('./src/routes/menu');
const orderRouter = require('./src/routes/orders');
const userRouter = require('./src/routes/users');
const uploadRouter = require('./src/routes/upload');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001; 


app.use(cors({
    origin: 'https://campus-bites-web.vercel.app', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


app.use(express.json()); 


app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);


app.get('/api/status', (req, res) => {
  res.json({ message: 'Campus Bites API is running smoothly on port 3001!', service: 'Backend' });
});


app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});