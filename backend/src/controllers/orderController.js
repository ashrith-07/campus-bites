const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create checkout (mock payment initialization)
const createCheckout = async (req, res) => {
  try {
    const { totalAmount, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    // ⭐ Generate mock payment order ID
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[Mock Payment] Order created:', mockOrderId);

    res.json({
      success: true,
      orderId: mockOrderId,
      amount: Math.round(totalAmount * 100), // Paise
      currency: 'INR',
      // Mock Razorpay response structure
      keyId: 'rzp_test_mock'
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
};

// Confirm order (mock payment verification)
const confirmOrder = async (req, res) => {
  try {
    const { totalAmount, items, paymentId, orderId, signature } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // ⭐ Mock payment verification (always succeeds)
    console.log('[Mock Payment] Verifying payment:', paymentId);
    console.log('[Mock Payment] Order ID:', orderId);

    // Create order in database
    const order = await prisma.order.create({
      data: {
        total: parseFloat(totalAmount),
        status: 'PENDING',
        paymentIntentId: paymentId || orderId, // Store payment reference

        // ⭐ FIX 1: Connect the user via their 'userId' from the token
        user: {
          connect: {
            id: req.user.userId 
          }
        },
        
        // ⭐ FIX 2: Connect the menu items
        items: {
          create: items.map(item => ({
            quantity: item.quantity,
            price: parseFloat(item.price || 0),
            menuItem: {
              connect: {
                id: parseInt(item.menuItemId) // Parse the ID just in case
              }
            }
          }))
        }
      },
      include: {
        items: { include: { menuItem: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // ⭐ FIX 3: Emit to user via Socket using req.user.userId
    if (global.emitToUser) {
      global.emitToUser(req.user.userId, 'order-update', {
        orderId: order.id,
        status: 'PENDING',
        message: `Your order #${order.id} has been placed successfully!`,
        timestamp: new Date().toISOString()
      });
    }

    console.log('[Order] Created successfully:', order.id);

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    // ⭐ FIX 4: Use req.user.userId to filter for customers
    const whereClause = req.user.role === 'VENDOR' 
      ? {} 
      : { userId: req.user.userId };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: { include: { menuItem: true } },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // ⭐ FIX 5: Use req.user.userId to check authorization
    if (req.user.role !== 'VENDOR' && order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // ⭐ Emit to customer via Socket
    const statusMessages = {
      'PENDING': `Your order #${orderId} is pending confirmation`,
      'PROCESSING': `Your order #${orderId} is being prepared! 👨‍🍳`,
      'READY': `Your order #${orderId} is ready for pickup! 🎉`,
      'COMPLETED': `Your order #${orderId} has been completed. Thank you!`,
      'CANCELLED': `Your order #${orderId} has been cancelled`
    };

    if (global.emitToUser) {
      global.emitToUser(existingOrder.userId, 'order-update', {
        orderId,
        status,
        message: statusMessages[status],
        timestamp: new Date().toISOString()
      });
    }

    // ⭐ FIX 6 (Minor): Use req.user.userId in the console log
    console.log(`[Order ${orderId}] Status updated to ${status} by vendor ${req.user.userId}`);

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete order
// Delete order
const deleteOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      // ⭐ FIX: Corrected the typo to 404 and added the .json response
      return res.status(404).json({ error: 'Order not found' });
    }

    // ⭐ FIX: Use req.user.userId to check authorization
    if (req.user.role !== 'VENDOR' && order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this order' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete completed orders' });
    }

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });

    if (req.user.role === 'VENDOR' && global.emitToUser) {
      global.emitToUser(order.userId, 'order-update', {
        orderId,
        status: 'CANCELLED',
        message: `Your order #${orderId} has been cancelled by the vendor`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

module.exports = {
  createCheckout,
  confirmOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};