// controllers/orderController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DELIVERY_FEE = 10; // ⭐ ₹10 delivery charge

// Create checkout session
const createCheckout = async (req, res) => {
  try {
    const { totalAmount, items, deliveryType, deliveryAddress, deliveryPhone } = req.body;

    console.log('[Checkout] Creating checkout:', { 
      userId: req.user.id, 
      totalAmount, 
      deliveryType,
      itemCount: items.length 
    });

    // Validate delivery requirements
    if (deliveryType === 'DELIVERY') {
      if (!deliveryAddress || deliveryAddress.length < 10) {
        return res.status(400).json({ error: 'Delivery address (min 10 characters) is required for delivery orders' });
      }
      if (!deliveryPhone || !/^[6-9]\d{9}$/.test(deliveryPhone)) {
        return res.status(400).json({ error: 'Valid 10-digit phone number is required for delivery orders' });
      }
    }

    // Check store status
    const storeSetting = await prisma.storeSetting.findUnique({
      where: { key: 'store_open' }
    });

    if (storeSetting && storeSetting.value === 'false') {
      return res.status(400).json({ error: 'Store is currently closed' });
    }

    // Validate items exist and are available
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } }
    });

    if (menuItems.length !== items.length) {
      return res.status(400).json({ error: 'Some menu items not found' });
    }

    // Check availability
    const unavailableItems = menuItems.filter(item => !item.isAvailable);
    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        error: 'Some items are not available',
        unavailableItems: unavailableItems.map(i => i.name)
      });
    }

    // ⭐ Calculate total with delivery fee
    let calculatedTotal = 0;
    items.forEach(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      calculatedTotal += parseFloat(menuItem.price) * item.quantity;
    });

    // Add GST
    calculatedTotal = calculatedTotal * 1.05;

    // Add delivery fee if delivery type is DELIVERY
    const deliveryFee = deliveryType === 'DELIVERY' ? DELIVERY_FEE : 0;
    calculatedTotal += deliveryFee;

    // Verify total matches (with small tolerance for floating point)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        calculated: calculatedTotal.toFixed(2),
        provided: totalAmount
      });
    }

    // Generate mock order ID for Razorpay
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      orderId,
      amount: totalAmount,
      deliveryFee,
      deliveryType,
      message: 'Checkout created successfully'
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
};

// Confirm order (with delivery support)
const confirmOrder = async (req, res) => {
  try {
    const { 
      paymentId, 
      orderId, 
      signature, 
      items, 
      totalAmount,
      deliveryType = 'PICKUP',
      deliveryAddress,
      deliveryPhone
    } = req.body;

    console.log('[Order] Confirming order:', { 
      userId: req.user.id, 
      paymentId, 
      deliveryType,
      totalAmount,
      deliveryPhone 
    });

    // Validate delivery requirements
    if (deliveryType === 'DELIVERY') {
      if (!deliveryAddress || deliveryAddress.length < 10) {
        return res.status(400).json({ error: 'Delivery address (min 10 characters) is required for delivery orders' });
      }
      if (!deliveryPhone || !/^[6-9]\d{9}$/.test(deliveryPhone)) {
        return res.status(400).json({ error: 'Valid 10-digit phone number is required for delivery orders' });
      }
    }

    // Check store status
    const storeSetting = await prisma.storeSetting.findUnique({
      where: { key: 'store_open' }
    });

    if (storeSetting && storeSetting.value === 'false') {
      return res.status(400).json({ error: 'Store is currently closed' });
    }

    // Calculate delivery fee
    const deliveryFee = deliveryType === 'DELIVERY' ? DELIVERY_FEE : 0;

    // ⭐ FIX: Remove 'price' field from items creation
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total: parseFloat(totalAmount).toFixed(2),
        status: 'PENDING',
        paymentIntentId: paymentId || 'COD',
        deliveryType,
        deliveryFee,
        deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : null,
        deliveryPhone: deliveryType === 'DELIVERY' ? deliveryPhone : null,
        items: {
          create: items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity
            // ⭐ REMOVED: price field - not in schema
          }))
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log(`[Order] Created order ${order.id} for user ${req.user.id} (${deliveryType})`);

    // Broadcast new order via Socket.IO
    if (global.io) {
      global.io.emit('new-order', {
        type: 'new-order',
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          deliveryType: order.deliveryType,
          deliveryFee: order.deliveryFee,
          deliveryPhone: order.deliveryPhone,
          customerName: order.user.name,
          createdAt: order.createdAt,
          itemCount: order.items.length
        }
      });
    }

    // Emit to user
    if (global.emitToUser) {
      global.emitToUser(req.user.id, 'order-update', {
        orderId: order.id,
        status: 'PENDING',
        message: `Your order #${order.id} has been placed successfully!`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      order: {
        ...order,
        deliveryFee: parseFloat(order.deliveryFee)
      }
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ 
      error: 'Failed to confirm order',
      details: error.message 
    });
  }
};

// Get all orders (vendor sees all, users see their own)
const getAllOrders = async (req, res) => {
  try {
    const whereClause = req.user.role === 'VENDOR' 
      ? {} 
      : { userId: req.user.id };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization (users can only see their own orders)
    if (req.user.role !== 'VENDOR' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order status (vendor only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log(`[Order] Updated order ${id} status to ${status}`);

    // Notify customer via Socket.IO
    if (global.emitToUser) {
      global.emitToUser(order.userId, 'order-update', {
        type: 'order-update',
        orderId: order.id,
        status: order.status,
        message: `Your order is now ${status.toLowerCase()}`
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow deletion of own orders or if vendor
    if (req.user.role !== 'VENDOR' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.order.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Order deleted successfully' });
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