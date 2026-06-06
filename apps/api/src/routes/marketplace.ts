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

export default router;
