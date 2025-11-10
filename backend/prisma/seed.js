const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  try {
    console.log('Deleting existing order items...');
    await prisma.orderItem.deleteMany();
    
    console.log('Deleting existing orders...');
    await prisma.order.deleteMany();
    
    console.log('Deleting existing menu items...');
    await prisma.menuItem.deleteMany();
    
    console.log('✅ Cleared existing data');

    
    console.log('Creating menu items...');
    const result = await prisma.menuItem.createMany({
      data: [
        {
          name: 'Classic Margherita Pizza',
          description: 'Fresh mozzarella, basil, and tomato sauce on a crispy crust',
          price: 180.00,
          category: 'Pizza',
          imageUrl: '🍕',
          stock: 20,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Pepperoni Pizza',
          description: 'Loaded with pepperoni and extra cheese',
          price: 220.00,
          category: 'Pizza',
          imageUrl: '🍕',
          stock: 18,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Paneer Tikka Roll',
          description: 'Grilled paneer with mint chutney wrapped in soft paratha',
          price: 95.00,
          category: 'Rolls',
          imageUrl: '🌯',
          stock: 15,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Chicken Roll',
          description: 'Tender chicken pieces with special sauce',
          price: 120.00,
          category: 'Rolls',
          imageUrl: '🌯',
          stock: 12,
          isAvailable: true,
          popular: false
        },
        {
          name: 'Masala Chai',
          description: 'Aromatic spiced tea brewed to perfection',
          price: 30.00,
          category: 'Beverages',
          imageUrl: '☕',
          stock: 50,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Cold Coffee',
          description: 'Refreshing iced coffee with ice cream',
          price: 65.00,
          category: 'Beverages',
          imageUrl: '🥤',
          stock: 20,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Mango Smoothie',
          description: 'Fresh mango blended with milk and ice',
          price: 85.00,
          category: 'Beverages',
          imageUrl: '🥤',
          stock: 15,
          isAvailable: true,
          popular: false
        },
        {
          name: 'Chocolate Brownie',
          description: 'Rich, fudgy brownie with a crispy top',
          price: 85.00,
          category: 'Desserts',
          imageUrl: '🍰',
          stock: 12,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Gulab Jamun',
          description: 'Traditional Indian sweet in sugar syrup',
          price: 60.00,
          category: 'Desserts',
          imageUrl: '🍡',
          stock: 20,
          isAvailable: true,
          popular: false
        },
        {
          name: 'Ice Cream Sundae',
          description: 'Three scoops with chocolate sauce and nuts',
          price: 120.00,
          category: 'Desserts',
          imageUrl: '🍨',
          stock: 10,
          isAvailable: true,
          popular: false
        },
        {
          name: 'Veg Sandwich',
          description: 'Fresh vegetables with cheese in toasted bread',
          price: 70.00,
          category: 'Sandwiches',
          imageUrl: '🥪',
          stock: 25,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Cheese Grilled Sandwich',
          description: 'Loaded with cheese and grilled to perfection',
          price: 85.00,
          category: 'Sandwiches',
          imageUrl: '🥪',
          stock: 20,
          isAvailable: true,
          popular: false
        },
        {
          name: 'Club Sandwich',
          description: 'Triple decker with chicken, egg, and veggies',
          price: 140.00,
          category: 'Sandwiches',
          imageUrl: '🥪',
          stock: 15,
          isAvailable: true,
          popular: false
        },
        {
          name: 'French Fries',
          description: 'Golden crispy fries',
          price: 60.00,
          category: 'Snacks',
          imageUrl: '🍟',
          stock: 30,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Crispy Samosa',
          description: 'Traditional Indian snack with spiced potato filling',
          price: 25.00,
          category: 'Snacks',
          imageUrl: '🥟',
          stock: 40,
          isAvailable: true,
          popular: true
        },
        {
          name: 'Veg Burger',
          description: 'Crispy veggie patty with fresh vegetables',
          price: 120.00,
          category: 'Snacks',
          imageUrl: '🍔',
          stock: 20,
          isAvailable: true,
          popular: false
        },
        {
          name: 'Chicken Burger',
          description: 'Juicy chicken patty with lettuce and mayo',
          price: 150.00,
          category: 'Snacks',
          imageUrl: '🍔',
          stock: 18,
          isAvailable: true,
          popular: false
        }
      ]
    });

    console.log(`✅ Created ${result.count} menu items`);
    
    
    const allItems = await prisma.menuItem.findMany();
    console.log(`\n📊 Total items in database: ${allItems.length}`);
    console.log('\n📋 Menu Items:');
    allItems.forEach(item => {
      console.log(`  ${item.imageUrl} ${item.name} - ₹${item.price} (${item.category}) ${item.popular ? '⭐' : ''}`);
    });
    
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during seed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
  });