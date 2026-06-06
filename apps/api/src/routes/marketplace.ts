import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/marketplace/listings
router.get('/listings', async (req, res) => {
    try {
        const listings = await prisma.marketListing.findMany({
            where: { status: 'AVAILABLE' },
            include: { seller: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, listings });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch listings' });
    }
});

// GET /api/marketplace/listings/:id
router.get('/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await prisma.marketListing.findUnique({
            where: { id },
            include: {
                seller: true,
                bids: {
                    include: { buyer: true },
                    orderBy: { amount: 'desc' },
                },
            },
        });
        if (!listing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }
        res.json({ success: true, listing });
    } catch (error) {
        console.error('Error fetching listing details:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch listing' });
    }
});

// POST /api/marketplace/listings
router.post('/listings', async (req, res) => {
    try {
        const { title, description, basePrice, condition, make, model, storage, images, sellerId } = req.body;
        
        if (!sellerId) {
            return res.status(400).json({ success: false, error: 'sellerId is required' });
        }

        const listing = await prisma.marketListing.create({
            data: {
                title,
                description,
                basePrice: parseFloat(basePrice),
                currentBid: parseFloat(basePrice),
                condition,
                make,
                model,
                storage,
                images: images || [],
                sellerId,
                status: 'AVAILABLE'
            }
        });
        res.json({ success: true, listing });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ success: false, error: 'Failed to create listing' });
    }
});

// POST /api/marketplace/listings/:id/bid
router.post('/listings/:id/bid', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, buyerId } = req.body;

        if (!buyerId || !amount) {
            return res.status(400).json({ success: false, error: 'buyerId and amount are required' });
        }

        const listing = await prisma.marketListing.findUnique({ where: { id } });
        if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });
        if (listing.status !== 'AVAILABLE') return res.status(400).json({ success: false, error: 'Listing is not available' });

        const bidAmount = parseFloat(amount);
        const currentHighest = listing.currentBid || listing.basePrice;

        if (bidAmount <= currentHighest) {
            return res.status(400).json({ success: false, error: 'Bid must be higher than the current bid' });
        }

        // Create the bid
        const bid = await prisma.customerBid.create({
            data: {
                listingId: id,
                buyerId,
                amount: bidAmount,
                status: 'PENDING'
            }
        });

        // Update the listing's current bid
        await prisma.marketListing.update({
            where: { id },
            data: { currentBid: bidAmount }
        });

        res.json({ success: true, bid });
    } catch (error) {
        console.error('Error placing bid:', error);
        res.status(500).json({ success: false, error: 'Failed to place bid' });
    }
});

// POST /api/marketplace/listings/:id/accept-bid
router.post('/listings/:id/accept-bid', async (req, res) => {
    try {
        const { id } = req.params;
        const { bidId } = req.body;

        const bid = await prisma.customerBid.findUnique({ where: { id: bidId } });
        if (!bid || bid.listingId !== id) {
            return res.status(404).json({ success: false, error: 'Bid not found' });
        }

        // Mark bid as WON
        await prisma.customerBid.update({
            where: { id: bidId },
            data: { status: 'WON' }
        });

        // Mark other bids as REJECTED
        await prisma.customerBid.updateMany({
            where: { listingId: id, id: { not: bidId } },
            data: { status: 'REJECTED' }
        });

        // Mark listing as SOLD
        await prisma.marketListing.update({
            where: { id },
            data: { status: 'SOLD' }
        });

        // Create Order
        const order = await prisma.order.create({
            data: {
                listingId: id,
                buyerId: bid.buyerId,
                totalAmount: bid.amount,
                status: 'PENDING'
            }
        });

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error accepting bid:', error);
        res.status(500).json({ success: false, error: 'Failed to accept bid' });
    }
});

// GET /api/marketplace/orders
router.get('/orders', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const orders = await prisma.order.findMany({
            where: { buyerId: String(userId) },
            include: { listing: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// POST /api/marketplace/seed — creates demo listings for testing
router.post('/seed', async (req, res) => {
    try {
        // Skip if already seeded
        const existing = await prisma.marketListing.count();
        if (existing >= 6) {
            return res.json({ success: true, message: 'Already seeded', count: existing });
        }

        // Get or create a demo seller user
        let seller = await prisma.user.findFirst({ where: { email: 'demo-seller@lotsitems.com' } });
        if (!seller) {
            seller = await prisma.user.create({
                data: {
                    email: 'demo-seller@lotsitems.com',
                    name: 'Demo Seller',
                    role: 'CUSTOMER',
                    password: 'demo',
                }
            });
        }

        const demoListings = [
            {
                title: 'iPhone 14 Pro — Excellent Condition',
                description: 'Barely used, always kept in a case. Battery health at 97%. Comes with original box and charger.',
                make: 'Apple', model: 'iPhone 14 Pro', storage: '256GB',
                condition: 'Mint', basePrice: 550, currentBid: 550,
                images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400&auto=format&fit=crop'],
            },
            {
                title: 'Samsung Galaxy S23 Ultra',
                description: 'Light scratches on back, screen is perfect. S Pen included. Fast charger included.',
                make: 'Samsung', model: 'Galaxy S23 Ultra', storage: '512GB',
                condition: 'Good', basePrice: 480, currentBid: 495,
                images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=400&auto=format&fit=crop'],
            },
            {
                title: 'MacBook Pro M2 — 2023',
                description: 'Used for 6 months, no dents or scratches. macOS Sonoma. Still under AppleCare until 2025.',
                make: 'Apple', model: 'MacBook Pro M2', storage: '512GB',
                condition: 'Mint', basePrice: 1100, currentBid: 1100,
                images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop'],
            },
            {
                title: 'Google Pixel 8 Pro',
                description: 'Purchased 3 months ago. Temperature sensor works great. Android 14 with all updates.',
                make: 'Google', model: 'Pixel 8 Pro', storage: '128GB',
                condition: 'Good', basePrice: 420, currentBid: 435,
                images: ['https://images.unsplash.com/photo-1598327105854-c8674faddf79?q=80&w=400&auto=format&fit=crop'],
            },
            {
                title: 'iPad Air 5th Gen — WiFi',
                description: 'Perfect screen, no scratches. Comes with Apple Pencil 1st gen and Smart Folio case.',
                make: 'Apple', model: 'iPad Air 5th Gen', storage: '256GB',
                condition: 'Good', basePrice: 380, currentBid: 390,
                images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400&auto=format&fit=crop'],
            },
            {
                title: 'iPhone 13 Mini — Minor Screen Crack',
                description: 'Hairline crack in bottom corner, fully functional. Great battery life at 91%.',
                make: 'Apple', model: 'iPhone 13 Mini', storage: '128GB',
                condition: 'Poor', basePrice: 180, currentBid: 180,
                images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?q=80&w=400&auto=format&fit=crop'],
            },
        ];

        const created = await Promise.all(
            demoListings.map(l =>
                prisma.marketListing.create({
                    data: { ...l, sellerId: seller!.id, status: 'AVAILABLE' }
                })
            )
        );

        res.json({ success: true, message: `${created.length} demo listings seeded` });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

export default router;

