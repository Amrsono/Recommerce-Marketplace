import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get customer profile overview
router.get('/:identifier', async (req: Request, res: Response) => {
    try {
        const identifier = req.params.identifier;
        if (!identifier) {
            return res.status(400).json({ success: false, error: 'Identifier is required' });
        }
        const isEmail = identifier.includes('@');

        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier as string } : { id: identifier as string },
            include: {
                tickets: {
                    include: { device: true },
                    orderBy: { createdAt: 'desc' }
                },
                notifications: {
                    where: { isRead: false },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                paymentMethods: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
});

// Get order details & history
router.get('/:identifier/orders', async (req: Request, res: Response) => {
    try {
        const identifier = req.params.identifier;
        if (!identifier) {
            return res.status(400).json({ success: false, error: 'Identifier is required' });
        }
        const isEmail = identifier.includes('@');

        // First resolve the actual DB User ID
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier as string } : { id: identifier as string },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const orders = await prisma.ticket.findMany({
            where: { customerId: user.id },
            include: { device: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Add a new payment method
router.post('/:identifier/payment-methods', async (req: Request, res: Response) => {
    try {
        const identifier = req.params.identifier;
        const { type, provider, last4, isDefault } = req.body;

        if (!type) {
            return res.status(400).json({ success: false, error: 'Type is required' });
        }

        const isEmail = identifier.includes('@');
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier as string } : { id: identifier as string },
            select: { id: true, paymentMethods: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // If it's the first payment method, force it to be default
        const shouldBeDefault = isDefault || user.paymentMethods.length === 0;

        if (shouldBeDefault) {
            // Unset other defaults for this user
            await prisma.paymentMethod.updateMany({
                where: { userId: user.id },
                data: { isDefault: false }
            });
        }

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                userId: user.id,
                type,
                provider: provider || null,
                last4: last4 || null,
                isDefault: shouldBeDefault
            }
        });

        res.json({ success: true, paymentMethod });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({ success: false, error: 'Failed to add payment method' });
    }
});

// Delete a payment method
router.delete('/:identifier/payment-methods/:id', async (req: Request, res: Response) => {
    try {
        const { identifier, id } = req.params;

        const isEmail = identifier.includes('@');
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier as string } : { id: identifier as string },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const pm = await prisma.paymentMethod.findFirst({
            where: { id, userId: user.id }
        });

        if (!pm) {
            return res.status(404).json({ success: false, error: 'Payment method not found' });
        }

        await prisma.paymentMethod.delete({
            where: { id }
        });

        // If the deleted one was default, set another one as default if exists
        if (pm.isDefault) {
            const nextPm = await prisma.paymentMethod.findFirst({
                where: { userId: user.id }
            });
            if (nextPm) {
                await prisma.paymentMethod.update({
                    where: { id: nextPm.id },
                    data: { isDefault: true }
                });
            }
        }

        res.json({ success: true, message: 'Payment method deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ success: false, error: 'Failed to delete payment method' });
    }
});

// Set a payment method as default
router.patch('/:identifier/payment-methods/:id/default', async (req: Request, res: Response) => {
    try {
        const { identifier, id } = req.params;

        const isEmail = identifier.includes('@');
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier as string } : { id: identifier as string },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Unset all defaults
        await prisma.paymentMethod.updateMany({
            where: { userId: user.id },
            data: { isDefault: false }
        });

        // Set this one as default
        const paymentMethod = await prisma.paymentMethod.update({
            where: { id },
            data: { isDefault: true }
        });

        res.json({ success: true, paymentMethod });
    } catch (error) {
        console.error('Error setting default payment method:', error);
        res.status(500).json({ success: false, error: 'Failed to set default payment method' });
    }
});

export default router;
