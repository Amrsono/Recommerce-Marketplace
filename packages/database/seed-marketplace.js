const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Checking existing listings...');
    const existing = await prisma.marketListing.count();
    if (existing >= 6) {
        console.log('Already seeded: ' + existing + ' listings exist.');
        return;
    }

    let seller = await prisma.user.findFirst({ where: { email: 'demo-seller@lotsitems.com' } });
    if (!seller) {
        seller = await prisma.user.create({
            data: { email: 'demo-seller@lotsitems.com', name: 'Demo Seller', role: 'CUSTOMER', password: 'demo' }
        });
        console.log('Created seller: ' + seller.id);
    }

    const items = [
        { title: 'iPhone 14 Pro', make: 'Apple', model: 'iPhone 14 Pro', storage: '256GB', condition: 'Mint', basePrice: 550, currentBid: 550, description: 'Barely used, battery 97%. Original box included.', images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400&auto=format&fit=crop'] },
        { title: 'Samsung Galaxy S23 Ultra', make: 'Samsung', model: 'Galaxy S23 Ultra', storage: '512GB', condition: 'Good', basePrice: 480, currentBid: 495, description: 'Light scratches on back, perfect screen. S Pen included.', images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=400&auto=format&fit=crop'] },
        { title: 'MacBook Pro M2 2023', make: 'Apple', model: 'MacBook Pro M2', storage: '512GB', condition: 'Mint', basePrice: 1100, currentBid: 1100, description: 'Used 6 months, no dents. macOS Sonoma. AppleCare until 2025.', images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop'] },
        { title: 'Google Pixel 8 Pro', make: 'Google', model: 'Pixel 8 Pro', storage: '128GB', condition: 'Good', basePrice: 420, currentBid: 435, description: 'Purchased 3 months ago. Android 14, all updates applied.', images: ['https://images.unsplash.com/photo-1598327105854-c8674faddf79?q=80&w=400&auto=format&fit=crop'] },
        { title: 'iPad Air 5th Gen WiFi', make: 'Apple', model: 'iPad Air 5th Gen', storage: '256GB', condition: 'Good', basePrice: 380, currentBid: 390, description: 'Perfect screen. Comes with Apple Pencil and Smart Folio.', images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400&auto=format&fit=crop'] },
        { title: 'iPhone 13 Mini', make: 'Apple', model: 'iPhone 13 Mini', storage: '128GB', condition: 'Poor', basePrice: 180, currentBid: 180, description: 'Hairline crack bottom corner, fully functional. Battery 91%.', images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?q=80&w=400&auto=format&fit=crop'] },
        { title: 'OnePlus 12 Like New', make: 'OnePlus', model: 'OnePlus 12', storage: '256GB', condition: 'Mint', basePrice: 520, currentBid: 520, description: 'Flagship in perfect condition. 100W Supervooc. 6 months old.', images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=400&auto=format&fit=crop'] },
        { title: 'Sony Xperia 1 V', make: 'Sony', model: 'Xperia 1 V', storage: '256GB', condition: 'Good', basePrice: 600, currentBid: 615, description: '4K 120fps video. Lightly used for travel.', images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=400&auto=format&fit=crop'] },
    ];

    for (var i = 0; i < items.length; i++) {
        var l = items[i];
        var listing = await prisma.marketListing.create({
            data: { title: l.title, make: l.make, model: l.model, storage: l.storage, condition: l.condition, basePrice: l.basePrice, currentBid: l.currentBid, description: l.description, images: l.images, sellerId: seller.id, status: 'AVAILABLE' }
        });
        console.log('Created: ' + listing.make + ' ' + listing.model + ' @ $' + listing.basePrice);
    }
    console.log('Done!');
}

main().catch(function(e) { console.error('Error:', e.message); process.exit(1); }).finally(function() { prisma.$disconnect(); });
