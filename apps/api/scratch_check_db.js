require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- Fetching all tickets and their associated devices ---');
    const tickets = await prisma.ticket.findMany({
        include: {
            device: true,
            customer: true,
            bids: {
                include: {
                    vendor: true
                }
            }
        }
    });

    console.log(`Found ${tickets.length} tickets:`);
    tickets.forEach(ticket => {
        console.log(`\nTicket ID: ${ticket.id}`);
        console.log(`Status: ${ticket.status}`);
        console.log(`Customer: ${ticket.customer?.name} (${ticket.customer?.email})`);
        console.log(`Device: ${ticket.device?.brand} ${ticket.device?.model}`);
        console.log(`Device ID: ${ticket.device?.id}`);
        console.log(`Device Condition: ${ticket.device?.condition}`);
        console.log(`Device Estimated Value: ${ticket.device?.estimatedVal}`);
        console.log(`Device Specs: ${JSON.stringify(ticket.device?.specs)}`);
        console.log(`Bids Count: ${ticket.bids?.length}`);
        ticket.bids.forEach(bid => {
            console.log(`  - Bid Amount: $${bid.amount} by Vendor: ${bid.vendor?.name} (${bid.vendor?.email}) - Status: ${bid.status}`);
        });
    });

    console.log('\n--- Fetching all vendors ---');
    const vendors = await prisma.user.findMany({
        where: { role: 'VENDOR' }
    });
    vendors.forEach(vendor => {
        console.log(`Vendor: ${vendor.name} (${vendor.email}) - ID: ${vendor.id}`);
    });
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); await pool.end(); });
