import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all bids for a specific ticket
router.get('/ticket/:ticketId', async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;
        const bids = await prisma.bid.findMany({
            where: { ticketId: ticketId as string },
            include: { vendor: { select: { id: true, name: true, email: true, trustScore: true } } },
            orderBy: { amount: 'desc' }
        });
        res.json({ success: true, bids });
    } catch (error) {
        console.error('Error fetching bids:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bids' });
    }
});

// Submit a new bid
router.post('/', async (req: Request, res: Response) => {
    try {
        const { ticketId, vendorId, amount } = req.body;
        
        if (!ticketId || !vendorId || !amount) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Make sure ticket is open
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket || (ticket.status !== 'OPEN' && ticket.status !== 'PRICING_ESTIMATED')) {
            return res.status(400).json({ success: false, error: 'Ticket is no longer accepting bids' });
        }

        // Upsert bid (vendor can only have one active bid per ticket, updates if already exists)
        const existingBid = await prisma.bid.findFirst({
            where: { ticketId, vendorId }
        });

        let bid;
        if (existingBid) {
            bid = await prisma.bid.update({
                where: { id: existingBid.id },
                data: { amount, status: 'PENDING' }
            });
        } else {
            bid = await prisma.bid.create({
                data: { ticketId, vendorId, amount }
            });
        }

        res.json({ success: true, bid });
    } catch (error) {
        console.error('Error submitting bid:', error);
        res.status(500).json({ success: false, error: 'Failed to submit bid' });
    }
});

// Accept a bid (Customer action)
router.post('/:bidId/accept', async (req: Request, res: Response) => {
    try {
        const { bidId } = req.params;

        const bid = await prisma.bid.findUnique({
            where: { id: bidId as string },
            include: { ticket: true }
        });

        if (!bid) return res.status(404).json({ success: false, error: 'Bid not found' });

        // Update the winning bid
        await prisma.bid.update({
            where: { id: bidId as string },
            data: { status: 'ACCEPTED' }
        });

        // Reject all other bids for this ticket
        await prisma.bid.updateMany({
            where: { 
                ticketId: bid.ticketId,
                id: { not: bidId as string }
            },
            data: { status: 'REJECTED' }
        });

        // Update the ticket
        const ticket = await prisma.ticket.update({
            where: { id: bid.ticketId },
            data: {
                status: 'ENGINEER_VISIT_SCHEDULED',
                winningVendorId: bid.vendorId
            },
            include: { device: true, winningVendor: true }
        });

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error accepting bid:', error);
        res.status(500).json({ success: false, error: 'Failed to accept bid' });
    }
});

export default router;
