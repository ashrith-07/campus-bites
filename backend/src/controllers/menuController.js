const prisma = require('../utils/prisma');

const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: { id: 'desc' }, 
    });
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to retrieve menu items.' });
  }
};

const getMenuItemById = async (req, res) => {
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid Menu Item ID.' });
  }

  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to retrieve menu item.' });
  }
};



const createMenuItem = async (req, res) => {
  const { name, description, price, imageUrl, category, stock, popular } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const newItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        category: category || 'Default',
        imageUrl: imageUrl || null,
        stock: stock || 0,
        popular: popular || false,
        isAvailable: true
      },
    });

    res.status(201).json({
      message: 'Menu item created successfully.',
      item: newItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item.' });
  }
};


const updateMenuItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  // NOTE: Day 23 (Zod) will validate the body contents
  const { name, description, price, imageUrl, category, stock, popular, isAvailable } = req.body;

  if (isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid Menu Item ID.' });
  }

  try {
    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        description: description || '',
        price: price ? parseFloat(price) : undefined,
        category: category || 'Default',
        imageUrl: imageUrl || null,
        stock: stock ?? undefined,
        popular: popular ?? undefined,
        isAvailable: isAvailable ?? undefined,
      },
    });

    res.status(200).json({
      message: 'Menu item updated successfully.',
      item: updatedItem,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found for update.' });
    }
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item.' });
  }
};



const deleteMenuItem = async (req, res) => {
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    return res.status(400).json({ error: 'Invalid Menu Item ID.' });
  }

  try {
    await prisma.menuItem.delete({
      where: { id: itemId },
    });

    res.status(204).send(); 

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found for deletion.' });
    }
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item.' });
  }
};


module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem, 
  deleteMenuItem, 
};