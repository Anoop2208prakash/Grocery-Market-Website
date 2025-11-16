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

  // --- 2. Create ALL 8 Categories ---
  const catVeg = await prisma.category.upsert({
    where: { name: 'Vegetables' },
    update: {}, create: { name: 'Vegetables' },
  });
  const catFruit = await prisma.category.upsert({
    where: { name: 'Fruits' },
    update: {}, create: { name: 'Fruits' },
  });
  const catDairy = await prisma.category.upsert({
    where: { name: 'Dairy & Eggs' },
    update: {}, create: { name: 'Dairy & Eggs' },
  });
  const catBakery = await prisma.category.upsert({
    where: { name: 'Bakery' },
    update: {}, create: { name: 'Bakery' },
  });
  const catMeat = await prisma.category.upsert({
    where: { name: 'Meat & Fish' },
    update: {}, create: { name: 'Meat & Fish' },
  });
  const catBev = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {}, create: { name: 'Beverages' },
  });
  const catSnacks = await prisma.category.upsert({
    where: { name: 'Snacks' },
    update: {}, create: { name: 'Snacks' },
  });
  const catPantry = await prisma.category.upsert({
    where: { name: 'Pantry' },
    update: {}, create: { name: 'Pantry' },
  });
  console.log('Created all 8 categories...');

  // --- 3. Create Products (with new images) ---
  await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: {
      imageUrl: 'https://zamaorganics.com/cdn/shop/files/banana1000_x_1000_px_1.png?v=1752738968',
      price: 50.00,
      categoryId: catVeg.id, // Linked to Vegetables
    },
    create: {
      sku: 'PROD-001',
      name: 'Organic Bananas',
      description: 'Fresh bananas',
      price: 50.00,
      categoryId: catVeg.id,
      imageUrl: 'https://zamaorganics.com/cdn/shop/files/banana1000_x_1000_px_1.png?v=1752738968',
    },
  });
  await prisma.product.upsert({
    where: { sku: 'PROD-002' },
    update: {
      imageUrl: 'https://deliaura.com/wp-content/uploads/2024/02/Farm-Fresh-Classic-Eggs-Pack-of-12.jpg',
      price: 40.00,
      categoryId: catDairy.id, // Linked to Dairy & Eggs
    },
    create: {
      sku: 'PROD-002',
      name: 'Farm Fresh Eggs (12 pack)',
      description: 'Large brown eggs',
      price: 40.00,
      categoryId: catDairy.id,
      imageUrl: 'https://deliaura.com/wp-content/uploads/2024/02/Farm-Fresh-Classic-Eggs-Pack-of-12.jpg',
    },
  });
  await prisma.product.upsert({
    where: { sku: 'PROD-003' },
    update: {
      imageUrl: 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/57618e37-2445-4835-b872-5af36ac5dcb0/Derivates/588f2b19-6a23-4643-a59e-8335def06f79.jpg',
      price: 60.00,
      categoryId: catBakery.id, // Linked to Bakery
    },
    create: {
      sku: 'PROD-003',
      name: 'Sourdough Loaf',
      description: 'Artisan bread',
      price: 60.00,
      categoryId: catBakery.id,
      imageUrl: 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/57618e37-2445-4835-b872-5af36ac5dcb0/Derivates/588f2b19-6a23-4643-a59e-8335def06f79.jpg',
    },
  });
  console.log('Created/updated products with real images...');

  // --- 4. CREATE THE DARK STORE ---
  const darkStore = await prisma.darkStore.upsert({
    where: { id: 'clxvw2k9w000008l41111aaaa' }, // Hardcoded predictable ID
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