const prisma = require('../utils/prisma');

// SSE clients storage - stores both response object and heartbeat interval
const clients = new Map();

// SSE Helper - Send order status update to specific user
const sendOrderStatusUpdate = (userId, order) => {
  const client = clients.get(userId);
  if (client && client.res) {
    try {
      const eventData = JSON.stringify({
        orderId: order.id,
        status: order.status,
        message: `Order #${order.id} is now ${order.status.toLowerCase()}.`
      });
      
      client.res.write(`event: order_update\n`);
      client.res.write(`data: ${eventData}\n\n`);
      console.log(`✅ SSE event sent to user ${userId} for order ${order.id}`);
    } catch (error) {
      console.error(`❌ Error sending SSE to user ${userId}:`, error.message);
      // Clean up dead connection
      cleanupClient(userId);
    }
  } else {
    console.log(`⚠️ No active SSE connection for user ${userId}`);
  }
};

// Helper to cleanup client connection
const cleanupClient = (userId) => {
  const client = clients.get(userId);
  if (client) {
    if (client.heartbeat) {
      clearInterval(client.heartbeat);
    }
    clients.delete(userId);
    console.log(`🧹 Cleaned up SSE connection for user ${userId}`);
  }
};

// 1. POST /api/orders/checkout
const initiateCheckout = async (req, res) => {
  const { totalAmount, items } = req.body; 

  if (!totalAmount || !items || items.length === 0) {
    return res.status(400).json({ error: 'Checkout requires total amount and items.' });
  }
  
  try {
    // Mock payment for now
    const mockPaymentIntentId = 'mock_pi_' + Date.now();
    
    res.status(200).json({ 
      success: true,
      message: 'Checkout initiated.',
      mockPaymentIntentId: mockPaymentIntentId,
      totalAmount: parseFloat(totalAmount)
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed.' });
  }
};

// 2. POST /api/orders/confirm
const confirmOrder = async (req, res) => {
  const customerId = req.user.userId; 
  const { totalAmount, items, paymentIntentId } = req.body; 

  console.log('Confirm order request:', { customerId, totalAmount, items, paymentIntentId });

  if (!totalAmount || !items || items.length === 0 || !paymentIntentId) {
    return res.status(400).json({ 
      error: 'Order confirmation requires total amount, items, and payment intent ID.' 
    });
  }
  
  try {
    // Create order with transaction
    const newOrder = await prisma.$transaction(async (prisma) => {
      
      // Create order
      const order = await prisma.order.create({
        data: {
          userId: customerId,
          total: parseFloat(totalAmount),
          status: 'PENDING',
          paymentIntentId: paymentIntentId,
        },
      });

      console.log('Order created:', order);

      // Create order items
      const orderItemsData = items.map(item => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      await prisma.orderItem.createMany({
        data: orderItemsData,
      });

      console.log('Order items created:', orderItemsData.length);

      return order;
    });

    console.log('Order confirmed successfully:', newOrder);

    // Send SSE notification to user if they're connected
    sendOrderStatusUpdate(customerId, newOrder);

    res.status(201).json({ 
      success: true,
      message: 'Order confirmed and placed successfully.',
      order: newOrder
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ 
      error: 'Failed to confirm order.',
      details: error.message 
    });
  }
};

// 3. GET /api/orders
const getOrders = async (req, res) => {
  const { userId, role } = req.user;
  
  try {
    let orders;

    if (role === 'VENDOR') {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: { include: { menuItem: true } }
        }
      });
    } else { 
      orders = await prisma.order.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { menuItem: true } }
        }
      });
    }

    res.status(200).json({ success: true, orders });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
};

// 4. GET /api/orders/:id
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
        user: { select: { id: true, email: true, name: true } },
        items: { include: { menuItem: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Authorization: Customer can only view their own orders
    if (role === 'CUSTOMER' && order.userId !== userId) {
      return res.status(403).json({ error: 'You do not have access to this order.' });
    }

    res.status(200).json({ success: true, order });

  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
};

// 5. PUT /api/orders/:id
const updateOrder = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body; 

  if (isNaN(orderId) || !status) {
    return res.status(400).json({ error: 'Invalid Order ID or missing status.' });
  }
  
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true, userId: true } 
    });

    console.log(`Order ${orderId} updated to ${status} for user ${updatedOrder.userId}`);

    // Send SSE update to the customer
    sendOrderStatusUpdate(updatedOrder.userId, updatedOrder);
    
    res.status(200).json({ 
      success: true,
      message: `Order ${orderId} status updated to ${status}.`,
      order: updatedOrder
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found.' });
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// 6. GET /api/orders/stream (SSE)
const connectToOrderStream = (req, res) => {
  const customerId = req.user.userId;

  // Check if user already has an active connection
  const existingClient = clients.get(customerId);
  if (existingClient) {
    console.log(`⚠️ User ${customerId} already has an active SSE connection. Closing old one.`);
    cleanupClient(customerId);
  }

  // Set SSE headers - DON'T set CORS here, it's handled in middleware
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx
  
  // Flush headers to establish connection immediately
  if (res.flushHeaders) {
    res.flushHeaders();
  }
  
  // Send initial connection message
  try {
    res.write(`data: ${JSON.stringify({ 
      message: "Connected to Campus Bites order stream.",
      userId: customerId,
      timestamp: new Date().toISOString()
    })}\n\n`);
  } catch (error) {
    console.error('Error sending initial message:', error);
    return;
  }

  console.log(`✅ SSE connection established for user ${customerId}`);

  // Setup heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    } catch (error) {
      console.error(`❌ Error sending heartbeat to user ${customerId}:`, error.message);
      cleanupClient(customerId);
    }
  }, 30000);

  // Store connection with heartbeat reference
  clients.set(customerId, {
    res: res,
    heartbeat: heartbeat,
    connectedAt: new Date()
  });

  // Cleanup on connection close
  req.on('close', () => {
    console.log(`🔌 SSE connection closed by client for user ${customerId}`);
    cleanupClient(customerId);
  });
  
  // Handle errors
  req.on('error', (error) => {
    console.error(`❌ SSE connection error for user ${customerId}:`, error.message);
    cleanupClient(customerId);
  });

  // Handle response finish
  res.on('finish', () => {
    console.log(`🏁 SSE response finished for user ${customerId}`);
    cleanupClient(customerId);
  });

  // Handle response errors
  res.on('error', (error) => {
    console.error(`❌ SSE response error for user ${customerId}:`, error.message);
    cleanupClient(customerId);
  });
};

// Export active clients count (useful for monitoring)
const getActiveConnectionsCount = () => {
  return clients.size;
};

module.exports = {
  initiateCheckout,
  confirmOrder,
  getOrders,
  getOrderById,
  updateOrder,
  connectToOrderStream,
  getActiveConnectionsCount
};