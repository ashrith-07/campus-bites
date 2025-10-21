const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv'); 


const authRouter = require('./src/routes/auth'); 
const menuRouter = require('./src/routes/menu');
const orderRouter = require('./src/routes/orders');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001; 


app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


app.use(express.json()); 


app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);


app.get('/api/status', (req, res) => {
  res.json({ message: 'Campus Bites API is running smoothly on port 3001!', service: 'Backend' });
});


app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});