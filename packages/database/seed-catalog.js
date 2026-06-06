const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const catalog = [
  // Apple iPhones
  ...['128GB','256GB','512GB','1TB'].flatMap(s => [
    { make: 'Apple', model: 'iPhone 15 Pro Max', storage: s },
    { make: 'Apple', model: 'iPhone 15 Pro', storage: s },
  ]),
  ...['128GB','256GB','512GB'].flatMap(s => [
    { make: 'Apple', model: 'iPhone 15 Plus', storage: s },
    { make: 'Apple', model: 'iPhone 15', storage: s },
    { make: 'Apple', model: 'iPhone 14 Pro Max', storage: s },
    { make: 'Apple', model: 'iPhone 14 Pro', storage: s },
    { make: 'Apple', model: 'iPhone 14 Plus', storage: s },
    { make: 'Apple', model: 'iPhone 14', storage: s },
    { make: 'Apple', model: 'iPhone 13 Pro Max', storage: s },
    { make: 'Apple', model: 'iPhone 13 Pro', storage: s },
    { make: 'Apple', model: 'iPhone 13', storage: s },
    { make: 'Apple', model: 'iPhone 13 Mini', storage: s },
    { make: 'Apple', model: 'iPhone 12 Pro Max', storage: s },
    { make: 'Apple', model: 'iPhone 12 Pro', storage: s },
    { make: 'Apple', model: 'iPhone 12', storage: s },
    { make: 'Apple', model: 'iPhone 12 Mini', storage: s },
  ]),
  // Apple MacBooks
  ...['256GB','512GB','1TB','2TB'].flatMap(s => [
    { make: 'Apple', model: 'MacBook Pro 16" M3', storage: s },
    { make: 'Apple', model: 'MacBook Pro 14" M3', storage: s },
    { make: 'Apple', model: 'MacBook Pro M2', storage: s },
    { make: 'Apple', model: 'MacBook Air M2', storage: s },
    { make: 'Apple', model: 'MacBook Air M1', storage: s },
  ]),
  // Apple iPads
  ...['64GB','128GB','256GB','512GB'].flatMap(s => [
    { make: 'Apple', model: 'iPad Pro 12.9" (6th Gen)', storage: s },
    { make: 'Apple', model: 'iPad Pro 11" (4th Gen)', storage: s },
    { make: 'Apple', model: 'iPad Air 5th Gen', storage: s },
    { make: 'Apple', model: 'iPad Air 4th Gen', storage: s },
    { make: 'Apple', model: 'iPad (10th Gen)', storage: s },
    { make: 'Apple', model: 'iPad Mini 6th Gen', storage: s },
  ]),

  // Samsung Galaxy S series
  ...['128GB','256GB','512GB','1TB'].flatMap(s => [
    { make: 'Samsung', model: 'Galaxy S24 Ultra', storage: s },
    { make: 'Samsung', model: 'Galaxy S24+', storage: s },
    { make: 'Samsung', model: 'Galaxy S24', storage: s },
    { make: 'Samsung', model: 'Galaxy S23 Ultra', storage: s },
    { make: 'Samsung', model: 'Galaxy S23+', storage: s },
    { make: 'Samsung', model: 'Galaxy S23', storage: s },
    { make: 'Samsung', model: 'Galaxy S22 Ultra', storage: s },
    { make: 'Samsung', model: 'Galaxy S22+', storage: s },
    { make: 'Samsung', model: 'Galaxy S22', storage: s },
  ]),
  // Samsung Z Fold/Flip
  ...['256GB','512GB'].flatMap(s => [
    { make: 'Samsung', model: 'Galaxy Z Fold 5', storage: s },
    { make: 'Samsung', model: 'Galaxy Z Fold 4', storage: s },
    { make: 'Samsung', model: 'Galaxy Z Flip 5', storage: s },
    { make: 'Samsung', model: 'Galaxy Z Flip 4', storage: s },
  ]),
  // Samsung Tablets
  ...['128GB','256GB','512GB'].flatMap(s => [
    { make: 'Samsung', model: 'Galaxy Tab S9 Ultra', storage: s },
    { make: 'Samsung', model: 'Galaxy Tab S9+', storage: s },
    { make: 'Samsung', model: 'Galaxy Tab S9', storage: s },
    { make: 'Samsung', model: 'Galaxy Tab S8 Ultra', storage: s },
  ]),

  // Google Pixel
  ...['128GB','256GB'].flatMap(s => [
    { make: 'Google', model: 'Pixel 8 Pro', storage: s },
    { make: 'Google', model: 'Pixel 8', storage: s },
    { make: 'Google', model: 'Pixel 8a', storage: s },
    { make: 'Google', model: 'Pixel 7 Pro', storage: s },
    { make: 'Google', model: 'Pixel 7', storage: s },
    { make: 'Google', model: 'Pixel 7a', storage: s },
    { make: 'Google', model: 'Pixel 6 Pro', storage: s },
    { make: 'Google', model: 'Pixel 6', storage: s },
    { make: 'Google', model: 'Pixel 6a', storage: s },
  ]),
  { make: 'Google', model: 'Pixel 8 Pro', storage: '512GB' },
  { make: 'Google', model: 'Pixel 7 Pro', storage: '512GB' },

  // Sony Xperia
  ...['128GB','256GB'].flatMap(s => [
    { make: 'Sony', model: 'Xperia 1 VI', storage: s },
    { make: 'Sony', model: 'Xperia 1 V', storage: s },
    { make: 'Sony', model: 'Xperia 5 V', storage: s },
    { make: 'Sony', model: 'Xperia 10 V', storage: s },
    { make: 'Sony', model: 'Xperia 1 IV', storage: s },
    { make: 'Sony', model: 'Xperia 5 IV', storage: s },
  ]),

  // OnePlus
  ...['128GB','256GB','512GB'].flatMap(s => [
    { make: 'OnePlus', model: 'OnePlus 12', storage: s },
    { make: 'OnePlus', model: 'OnePlus 11', storage: s },
    { make: 'OnePlus', model: 'OnePlus 12R', storage: s },
    { make: 'OnePlus', model: 'OnePlus Nord 4', storage: s },
    { make: 'OnePlus', model: 'OnePlus Nord 3', storage: s },
    { make: 'OnePlus', model: 'OnePlus 10 Pro', storage: s },
  ]),

  // Xiaomi
  ...['128GB','256GB','512GB'].flatMap(s => [
    { make: 'Xiaomi', model: 'Xiaomi 14 Ultra', storage: s },
    { make: 'Xiaomi', model: 'Xiaomi 14 Pro', storage: s },
    { make: 'Xiaomi', model: 'Xiaomi 14', storage: s },
    { make: 'Xiaomi', model: 'Xiaomi 13 Pro', storage: s },
    { make: 'Xiaomi', model: 'Xiaomi 13', storage: s },
    { make: 'Xiaomi', model: 'Redmi Note 13 Pro+', storage: s },
    { make: 'Xiaomi', model: 'Redmi Note 13 Pro', storage: s },
  ]),

  // Huawei
  ...['128GB','256GB','512GB'].flatMap(s => [
    { make: 'Huawei', model: 'Pura 70 Pro+', storage: s },
    { make: 'Huawei', model: 'Pura 70 Pro', storage: s },
    { make: 'Huawei', model: 'P60 Pro', storage: s },
    { make: 'Huawei', model: 'Mate 60 Pro', storage: s },
    { make: 'Huawei', model: 'MatePad Pro 13.2"', storage: s },
  ]),

  // Other (generic fallback)
  ...['64GB','128GB','256GB','512GB'].map(s => ({ make: 'Other', model: 'Other Model', storage: s })),
];

async function main() {
  console.log(`Seeding ${catalog.length} catalog entries...`);
  
  // Remove duplicates before inserting
  const unique = catalog.filter((item, idx, arr) =>
    idx === arr.findIndex(t => t.make === item.make && t.model === item.model && t.storage === item.storage)
  );

  const result = await prisma.deviceCatalog.createMany({
    data: unique,
    skipDuplicates: true,
  });

  console.log(`✅ Inserted ${result.count} new catalog entries (duplicates skipped).`);
  
  // Verify counts
  const total = await prisma.deviceCatalog.count();
  const makes = await prisma.deviceCatalog.findMany({ select: { make: true }, distinct: ['make'] });
  console.log(`📊 Total catalog entries: ${total}`);
  console.log(`🏷️  Makes available: ${makes.map(m => m.make).join(', ')}`);
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
