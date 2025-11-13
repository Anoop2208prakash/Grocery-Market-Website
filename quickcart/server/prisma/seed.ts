// server/prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- 1. Create a Test Admin User ---
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

  // --- 1.5 Create a Test Driver User (NEW) ---
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@quickcart.com' },
    update: {},
    create: {
      email: 'driver@quickcart.com',
      name: 'Speedy Driver',
      password: hashedPassword, // Uses same 'admin123' password
      role: UserRole.DRIVER,
    },
  });
  console.log(`Created driver user: ${driverUser.email}`);

  // --- 2. Create Categories ---
  const cat1 = await prisma.category.upsert({
    where: { name: 'Fresh Produce' },
    update: {},
    create: { name: 'Fresh Produce' },
  });
  const cat2 = await prisma.category.upsert({
    where: { name: 'Dairy & Eggs' },
    update: {},
    create: { name: 'Dairy & Eggs' },
  });
  const cat3 = await prisma.category.upsert({
    where: { name: 'Bakery' },
    update: {},
    create: { name: 'Bakery' },
  });
  console.log('Created categories...');

  // --- 3. Create Products ---
  await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: {},
    create: {
      sku: 'PROD-001',
      name: 'Organic Bananas',
      description: 'Fresh bananas',
      price: 2.99,
      categoryId: cat1.id,
    },
  });
  await prisma.product.upsert({
    where: { sku: 'PROD-002' },
    update: {},
    create: {
      sku: 'PROD-002',
      name: 'Farm Fresh Eggs (12 pack)',
      description: 'Large brown eggs',
      price: 4.5,
      categoryId: cat2.id,
    },
  });
  await prisma.product.upsert({
    where: { sku: 'PROD-003' },
    update: {},
    create: {
      sku: 'PROD-003',
      name: 'Sourdough Loaf',
      description: 'Artisan bread',
      price: 5.99,
      categoryId: cat3.id,
    },
  });
  console.log('Created products...');

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
          quantity: 100, // Re-stock to 100 if it exists
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });