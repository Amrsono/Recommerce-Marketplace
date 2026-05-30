const { PrismaClient } = require('..')
const bcrypt = require('bcryptjs')

const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Ensure Admin User exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      role: 'ADMIN',
      name: 'System Admin',
      password: hashedPassword
    },
    create: {
      email: 'admin@test.com',
      name: 'System Admin',
      role: 'ADMIN',
      password: hashedPassword
    },
  })

  console.log(`✅ Admin user ensured: ${admin.email}`)

  // Create Sample Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      name: 'John Doe',
      role: 'CUSTOMER',
      password: hashedPassword
    },
  })
  console.log(`✅ Sample customer created: ${customer.email}`)

  // Create Sample Device & Ticket
  const device = await prisma.device.create({
    data: {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      condition: 'Mint',
      specs: { storage: '256GB', color: 'Natural Titanium' },
      estimatedVal: 850,
      userId: customer.id,
    }
  })

  await prisma.ticket.create({
    data: {
      deviceId: device.id,
      customerId: customer.id,
      status: 'PRICING_ESTIMATED',
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h from now
      isUrgent: false,
    }
  })

  console.log('✅ Sample trade-in and ticket created.')
  console.log('✨ Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
