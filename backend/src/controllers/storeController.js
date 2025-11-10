const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getStoreStatus = async (req, res) => {
  try {
    let storeSetting = await prisma.storeSetting.findUnique({
      where: { key: 'store_open' }
    });

    if (!storeSetting) {
      storeSetting = await prisma.storeSetting.create({
        data: {
          key: 'store_open',
          value: 'true'
        }
      });
    }

    const isOpen = storeSetting.value === 'true';

    res.json({
      success: true,
      isOpen,
      updatedAt: storeSetting.updatedAt
    });
  } catch (error) {
    console.error('Error fetching store status:', error);
    res.status(500).json({ error: 'Failed to fetch store status' });
  }
};

const updateStoreStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ error: 'isOpen must be a boolean' });
    }

    const storeSetting = await prisma.storeSetting.upsert({
      where: { key: 'store_open' },
      update: { value: isOpen.toString() },
      create: {
        key: 'store_open',
        value: isOpen.toString()
      }
    });

    console.log(`[Store] Status updated to ${isOpen} by vendor ${req.user.id}`);

    
    if (global.broadcastStoreStatus) {
      await global.broadcastStoreStatus({
        isOpen,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      isOpen,
      updatedAt: storeSetting.updatedAt
    });
  } catch (error) {
    console.error('Error updating store status:', error);
    res.status(500).json({ error: 'Failed to update store status' });
  }
};

module.exports = {
  getStoreStatus,
  updateStoreStatus
};