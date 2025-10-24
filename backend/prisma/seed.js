const {prisma} = require('../../src/utils/prisma');

async function main() {
  console.log('🌱 Starting seed...');

  // Delete existing data (optional - for testing)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  console.log('🗑️  Cleared existing data');

  // Create menu items with ALL fields
  const menuItems = await prisma.menuItem.createMany({
    data: [
      {
        name: 'Classic Margherita Pizza',
        description: 'Fresh mozzarella, basil, and tomato sauce on a crispy crust',
        price: 180.00,
        category: 'Pizza',
        imageUrl: '🍕',
        stock: 20,
        isAvailable: true,
        popular: true // ← Mark as popular
      },
      {
        name: 'Paneer Tikka Roll',
        description: 'Grilled paneer with mint chutney wrapped in soft paratha',
        price: 95,
        category: 'Rolls',
        imageUrl: '🌯',
        stock: 15,
        isAvailable: true,
        popular: true
      },
      {
        name: 'Masala Chai',
        description: 'Aromatic spiced tea brewed to perfection',
        price: 30,
        category: 'Beverages',
        imageUrl: '☕',
        stock: 50,
        isAvailable: true,
        popular: false
      },
      {
        name: 'Chocolate Brownie',
        description: 'Rich, fudgy brownie with a crispy top',
        price: 85,
        category: 'Desserts',
        imageUrl: '🍰',
        stock: 12,
        isAvailable: true,
        popular: true
      },
      {
        name: 'Veg Sandwich',
        description: 'Fresh vegetables with cheese in toasted bread',
        price: 70,
        category: 'Sandwiches',
        imageUrl: '🥪',
        stock: 25,
        isAvailable: true,
        popular: false
      },
      {
        name: 'French Fries',
        description: 'Golden crispy fries',
        price: 60,
        category: 'Snacks',
        imageUrl: '🍟',
        stock: 30,
        isAvailable: true,
        popular: false
      },
      {
        name: 'Crispy Samosa',
        description: 'Traditional Indian snack with spiced potato filling',
        price: 25,
        category: 'Snacks',
        imageUrl: '🥟',
        stock: 40,
        isAvailable: true,
        popular: true
      },
      {
        name: 'Cold Coffee',
        description: 'Refreshing iced coffee with ice cream',
        price: 65,
        category: 'Beverages',
        imageUrl: '🥤',
        stock: 20,
        isAvailable: true,
        popular: false
      },
      {
        name: 'Chicken Burger',
        description: 'Juicy chicken patty with lettuce and mayo',
        price: 150,
        category: 'Burgers',
        imageUrl: '🍔',
        stock: 18,
        isAvailable: true,
        popular: false
      },
      {
        name: 'Veg Burger',
        description: 'Crispy veggie patty with fresh vegetables',
        price: 120,
        category: 'Burgers',
        imageUrl: '🍔',
        stock: 20,
        isAvailable: true,
        popular: false
      }
    ]
  });

  console.log(`✅ Created ${menuItems.count} menu items`);
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });