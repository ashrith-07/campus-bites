const prisma = require('../utils/prisma');

// --- SSE Cache for Connected Clients ---
// Store connections by userId (Key: UserId, Value: Response object)
const clients = new Map(); 
// ---------------------------------------

const INITIAL_ORDER_STATUS = 'PAID'; // Status is PAID since payment is confirmed upon hitting confirmOrder

// --- SSE Helper Function ---
const sendOrderStatusUpdate = (userId, order) => {
  const clientRes = clients.get(userId);
  if (clientRes) {
    // Structure the event data
    const eventData = JSON.stringify({
      orderId: order.id,
      status: order.status,
      message: `Order #${order.id} is now ${order.status.toLowerCase()}.`
    });
    
    // Write the SSE message: event:order_update\ndata:{...}\n\n
    clientRes.write(`event: order_update\n`);
    clientRes.write(`data: ${eventData}\n\n`);
    console.log(`SSE event sent to user ${userId} for order ${order.id}.`);
  }
};



const initiateCheckout = async (req, res) => {
  const { totalAmount, items } = req.body; 

  if (!totalAmount || !items || items.length === 0) {
    return res.status(400).json({ error: 'Checkout request must include total amount and at least one item.' });
  }
  
  // NOTE: On Day 21 (Payment Gateway), this is where we will integrate Razorpay
  // and return the necessary Payment Intent ID (razorpay_order_id) to the frontend.

  // Mock success response for now:
  res.status(200).json({ 
      message: 'Checkout initiated successfully. Proceed to payment.',
      mockPaymentIntentId: 'mock_pi_' + Date.now(),
      totalAmount: parseFloat(totalAmount)
  });
};


const confirmOrder = async (req, res) => {
  const customerId = req.user.userId; 
  const { totalAmount, items, paymentIntentId } = req.body; 

  if (!totalAmount || !items || items.length === 0 || !paymentIntentId) {
    return res.status(400).json({ error: 'Order confirmation requires total amount, items, and a payment intent ID.' });
  }

  // NOTE: On Day 21 (Payment Gateway), this is where we will verify the paymentIntentId.
  
  try {
    // Transaction: Save the Order and its Items
    const newOrder = await prisma.$transaction(async (prisma) => {
      
     
      const order = await prisma.order.create({
        data: {
          customerId: customerId,
          totalAmount: parseFloat(totalAmount),
          status: INITIAL_ORDER_STATUS,
          paymentIntentId: paymentIntentId, 
        },
      });

    
      const orderItemsData = items.map(item => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: parseFloat(item.price),
      }));

      await prisma.orderItem.createMany({
        data: orderItemsData,
      });

      return order;
    });

    res.status(201).json({ 
      message: 'Order confirmed and placed successfully.',
      order: newOrder
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order.' });
  }
};


const getOrders = async (req, res) => {
  const { userId, role } = req.user;
  
  try {
    let orders;

    if (role === 'VENDOR') {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, email: true, name: true } },
          items: { include: { menuItem: true } }
        }
      });
    } else { 
      orders = await prisma.order.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { menuItem: true } }
        }
      });
    }

    res.status(200).json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
};


const getOrderById = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { userId, role } = req.user;

  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid Order ID.' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, email: true, name: true } },
        items: { include: { menuItem: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Authorization Check: Customer can only view their own order
    if (role === 'CUSTOMER' && order.customerId !== userId) {
      return res.status(403).json({ error: 'Forbidden. You do not have access to this order.' });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
};

// 5. PUT /api/orders/:id (Vendor updates order status)
const updateOrder = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body; 

  if (isNaN(orderId) || !status) {
    return res.status(400).json({ error: 'Invalid Order ID or missing status.' });
  }
  
  try {
    // 1. Update the order status in the database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true, customerId: true } 
    });

    // 2. 📢 Push update via SSE
    sendOrderStatusUpdate(updatedOrder.customerId, updatedOrder);
    
    res.status(200).json({ 
      message: `Order ${orderId} status updated to ${status}.`,
      order: updatedOrder
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found for update.' });
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// 6. GET /api/orders/stream (SSE Connection Handler)
const connectToOrderStream = (req, res) => {
  const customerId = req.user.userId;

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000'); 
  
  // Send an initial ping event
  res.write(`data: {"message": "Connected to Campus Bites order stream."}\n\n`);

  // Store the client's response object
  clients.set(customerId, res);

  // Handle client disconnection
  req.on('close', () => {
    console.log(`SSE connection closed for user ${customerId}`);
    clients.delete(customerId);
  });
};


module.exports = {
  initiateCheckout,
  confirmOrder,
  getOrders,
  getOrderById,
  updateOrder,
  connectToOrderStream, 
};