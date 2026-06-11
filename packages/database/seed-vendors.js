const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const vendors = [
    { name: 'TechBay Electronics', email: 'techbay@vendor.com', password: 'vendor123' },
    { name: 'GadgetHub Dubai', email: 'gadgethub@vendor.com', password: 'vendor123' },
    { name: 'SmartDeal MENA', email: 'smartdeal@vendor.com', password: 'vendor123' },
];

async function main() {
    console.log('🌱 Creating vendor accounts...\n');

    for (const vendor of vendors) {
        const hashed = await bcrypt.hash(vendor.password, 10);
        const user = await prisma.user.upsert({
            where: { email: vendor.email },
            update: { role: 'VENDOR' },
            create: {
                name: vendor.name,
                email: vendor.email,
                password: hashed,
                role: 'VENDOR',
            },
        });
        console.log(`✅  ${user.name} (${user.email}) — role: ${user.role}`);
    }

    console.log('\n🎉 Done! All vendor accounts use password: vendor123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
