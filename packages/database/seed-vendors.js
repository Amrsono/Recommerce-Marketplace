const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
