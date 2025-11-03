const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// Helper function to send order updates to specific user
const sendOrderUpdate = async (userId, data) => {
  try {
    await pusher.trigger(`user-${userId}`, 'order-update', data);
    console.log(`[Pusher] ✅ Order update sent to user ${userId}:`, data);
    return true;
  } catch (error) {
    console.error(`[Pusher] ❌ Failed to send order update to user ${userId}:`, error);
    return false;
  }
};

// Helper function to broadcast store status to all users
const broadcastStoreStatus = async (data) => {
  try {
    await pusher.trigger('store-updates', 'store-status', data);
    console.log(`[Pusher] ✅ Store status broadcasted:`, data);
    return true;
  } catch (error) {
    console.error(`[Pusher] ❌ Failed to broadcast store status:`, error);
    return false;
  }
};

module.exports = {
  pusher,
  sendOrderUpdate,
  broadcastStoreStatus
};