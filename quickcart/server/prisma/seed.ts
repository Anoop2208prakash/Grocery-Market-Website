// server/prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- 1. Create Users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@quickcart.com' },
    update: {},
    create: {
      email: 'admin@quickcart.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // Driver
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@quickcart.com' },
    update: {},
    create: {
      email: 'driver@quickcart.com',
      name: 'Speedy Driver',
      password: hashedPassword,
      role: UserRole.DRIVER,
    },
  });
  console.log(`Created driver user: ${driverUser.email}`);

  // Packer
  const packerUser = await prisma.user.upsert({
    where: { email: 'packer@quickcart.com' },
    update: {},
    create: {
      email: 'packer@quickcart.com',
      name: 'Warehouse Packer',
      password: hashedPassword,
      role: UserRole.PACKER,
    },
  });
  console.log(`Created packer user: ${packerUser.email}`);
  // -------------------

  // --- 2. Create Categories & Subcategories ---
  const categoriesData = [
    { 
      name: 'Vegetables', 
      subs: ['Leafy Greens', 'Root Vegetables', 'Exotic', 'Organic'] 
    },
    { 
      name: 'Fruits', 
      subs: ['Citrus', 'Berries', 'Tropical', 'Seasonal'] 
    },
    { 
      name: 'Dairy & Eggs', 
      subs: ['Milk', 'Cheese', 'Butter', 'Eggs', 'Yogurt'] 
    },
    { 
      name: 'Bakery', 
      subs: ['Bread', 'Pastries', 'Cakes', 'Cookies'] 
    },
    { 
      name: 'Meat & Fish', 
      subs: ['Chicken', 'Red Meat', 'Seafood', 'Frozen'] 
    },
    { 
      name: 'Beverages', 
      subs: ['Soda', 'Juice', 'Water', 'Tea', 'Coffee'] 
    },
    { 
      name: 'Snacks', 
      subs: ['Chips', 'Chocolates', 'Nuts', 'Biscuits'] 
    },
    { 
      name: 'Pantry', 
      subs: ['Rice', 'Pasta', 'Spices', 'Oil', 'Sauces'] 
    },
  ];

  for (const catData of categoriesData) {
    // Create/Get Category
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: {},
      create: { name: catData.name },
    });

    console.log(`Created category: ${category.name}`);

    // Create Subcategories for this Category
    for (const subName of catData.subs) {
      // Check if subcategory exists to avoid duplicates
      const existingSub = await prisma.subCategory.findFirst({
        where: { name: subName, categoryId: category.id }
      });

      if (!existingSub) {
        await prisma.subCategory.create({
          data: {
            name: subName,
            categoryId: category.id
          }
        });
        console.log(` - Added subcategory: ${subName}`);
      }
    }
  }
  console.log('Categories and Subcategories setup complete.');

  // --- 3. Create Products (Optional - You can uncomment/add logic here) ---
  // await prisma.product.upsert({ ... }); 
  
  // --- 4. CREATE THE DARK STORE ---
  const darkStore = await prisma.darkStore.upsert({
    where: { id: 'clxvw2k9w000008l41111aaaa' },
    update: {},
    create: {
      id: 'clxvw2k9w000008l41111aaaa',
      name: 'Central Dark Store',
      address: '123 Main St',
      lat: 10.0,
      lng: 10.0,
    },
  });
  console.log(`Created dark store: ${darkStore.name}`);

  // --- 5. ADD STOCK TO THE DARK STORE ---
  const products = await prisma.product.findMany();
  
  if (products.length > 0) {
    console.log('Adding stock items...');
    for (const product of products) {
      await prisma.stockItem.upsert({
        where: {
          productId_darkStoreId: {
            productId: product.id,
            darkStoreId: darkStore.id,
          },
        },
        update: {
          quantity: 100, // Re-stock to 100
        },
        create: {
          productId: product.id,
          darkStoreId: darkStore.id,
          quantity: 100, // Initial stock
        },
      });
    }
    console.log('Stock items created (100 per product).');
  }

  // --- 6. CREATE DELIVERY SLOTS (Next 7 Days) ---
  console.log('Creating delivery slots...');
  
  // Optional: Clear existing slots to prevent duplicates if you run seed multiple times
  // await prisma.deliverySlot.deleteMany({});

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Create slots from 8 AM to 8 PM
    for (let hour = 8; hour < 20; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Don't create slots in the past for today
      if (startTime > new Date()) {
        await prisma.deliverySlot.create({
          data: {
            startTime,
            endTime,
            capacity: 5 // 5 orders per hour
          }
        });
      }
    }
  }
  console.log('Delivery slots created.');

  console.log('Seeding finished.');
}

async function runSeed() {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();