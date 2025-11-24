const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});


const sendOrderUpdate = async (userId, data) => {
  try {
    await pusher.trigger(`user-${userId}`, 'order-update', data);
    return true;
  } catch (error) {
    console.error(`[Pusher] ❌ Failed to send order update to user ${userId}:`, error);
    return false;
  }
};


const broadcastStoreStatus = async (data) => {
  try {
    await pusher.trigger('store-updates', 'store-status', data);
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