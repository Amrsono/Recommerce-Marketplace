// @ts-nocheck
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { prisma } from './db';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import profileRouter from './routes/profile';
import chatRouter from './routes/chat';
import settingsRouter from './routes/settings';
import bidsRouter from './routes/bids';
import bcrypt from 'bcryptjs';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: '*', // Allows all origins since we use JWT for security
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Routes
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/chat', chatRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/bids', bidsRouter);

app.get('/api/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: { device: true, customer: true },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Fetched ${tickets.length} tickets`);
        // @ts-ignore: Prisma types across workspace bounds lose include inference
        const formattedTickets = tickets.map(ticket => {
            const specs: any = ticket.device.specs || {};
            return {
                id: ticket.id,
                device: `${ticket.device.brand} ${ticket.device.model}`,
                status: ticket.status,
                slaDeadline: ticket.slaDeadline.toISOString(),
                isUrgent: ticket.isUrgent || (new Date(ticket.slaDeadline).getTime() - new Date().getTime() < 12 * 60 * 60 * 1000),
                estimatedVal: ticket.device.estimatedVal,
                condition: ticket.device.condition,
                specs: ticket.device.specs,
                evaluationMethod: specs.evaluationMethod || 'home-visit',
                storeName: specs.storeName || null,
                storeAddress: specs.address && specs.evaluationMethod === 'store' ? specs.address : null,
            };
        });
        res.json({ success: true, tickets: formattedTickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const [totalTickets, openTickets, totalUsers, totalDevices, resolvedTickets] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: 'OPEN' } }),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.device.count(),
            prisma.ticket.count({ where: { status: 'RESOLVED' } }),
        ]);

        // SLA fulfilment: resolved / total (avoid divide by zero)
        const slaFulfillment = totalTickets > 0
            ? ((resolvedTickets / totalTickets) * 100).toFixed(1)
            : '0.0';

        // Last 6 months device submission volume grouped by month
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const recentDevices = await prisma.device.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Build month buckets for the last 6 months
        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthMap: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
            monthMap[key] = 0;
        }
        for (const { createdAt } of recentDevices) {
            const key = `${MONTH_NAMES[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
            if (key in monthMap) monthMap[key]++;
        }
        const volumeData = Object.entries(monthMap).map(([name, devices]) => ({
            name: name.split(' ')[0], // Short month name for chart
            devices,
        }));

        // Last 7 days ticket submission for the weekly bar chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentTickets = await prisma.ticket.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true },
        });

        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = DAY_NAMES[d.getDay()];
            dayMap[key] = 0;
        }
        for (const { createdAt } of recentTickets) {
            const key = DAY_NAMES[createdAt.getDay()];
            if (key in dayMap) dayMap[key]++;
        }
        const weeklyData = Object.entries(dayMap).map(([name, tickets]) => ({ name, tickets }));

        res.json({
            success: true,
            stats: {
                totalTickets,
                openTickets,
                totalUsers,
                totalDevices,
                slaFulfillment: `${slaFulfillment}%`,
            },
            volumeData,
            weeklyData,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// Ensure admin user has the correct role
app.post('/api/setup/ensure-admin', async (req, res) => {
    try {
        const admin = await prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: { role: 'ADMIN', name: 'System Admin' },
            create: { email: 'admin@test.com', name: 'System Admin', role: 'ADMIN' }
        });
        console.log(`[Setup] Admin user ensured: id=${admin.id}, role=${admin.role}`);
        res.json({ success: true, admin: { id: admin.id, role: admin.role } });
    } catch (error) {
        console.error('Error ensuring admin:', error);
        res.status(500).json({ success: false, error: 'Failed to ensure admin user' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lotsitems-api' });
});

app.patch('/api/tickets/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isUrgent, scheduledVisit, visitStatus } = req.body;

        const data: any = {};
        if (status) {
            if (!['OPEN', 'PRICING_ESTIMATED', 'ENGINEER_VISIT_SCHEDULED', 'STORE_VISIT_SCHEDULED', 'RESOLVED', 'REJECTED'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }
            data.status = status;
        }
        
        if (typeof isUrgent === 'boolean') {
            data.isUrgent = isUrgent;
        }

        if (scheduledVisit) {
            data.scheduledVisit = new Date(scheduledVisit);
            data.visitStatus = 'PENDING';
        }

        if (visitStatus) {
            data.visitStatus = visitStatus;
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data,
            include: { device: true }
        });

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ success: false, error: 'Failed to update ticket' });
    }
});

// Mark a store-visit ticket as arrived (customer walked into store)
app.post('/api/tickets/:id/mark-arrived', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status: 'RESOLVED' },
            include: { device: true }
        });
        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error marking arrived:', error);
        res.status(500).json({ success: false, error: 'Failed to mark arrived' });
    }
});

// Approve a scheduled visit
app.post('/api/tickets/:id/approve-visit', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { 
                visitStatus: 'APPROVED',
                status: 'ENGINEER_VISIT_SCHEDULED'
            },
            include: { device: true }
        });
        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error approving visit:', error);
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

// Get single ticket detail
app.get('/api/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                device: true,
                customer: true,
                messages: {
                    include: { sender: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }
        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ticket' });
    }
});

// Customer accepts an offer
app.post('/api/tickets/:id/accept-offer', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status: 'ENGINEER_VISIT_SCHEDULED' },
            include: { device: true }
        });
        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ success: false, error: 'Failed to accept offer' });
    }
});

// Customer rejects an offer
app.post('/api/tickets/:id/reject-offer', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status: 'REJECTED' }, 
            include: { device: true }
        });
        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error rejecting offer:', error);
        res.status(500).json({ success: false, error: 'Failed to reject offer' });
    }
});

// Auto-seed database on startup
async function ensureAdmin() {
    try {
        console.log('[Startup] Ensuring admin account...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: { role: 'ADMIN', name: 'System Admin', password: hashedPassword },
            create: { email: 'admin@test.com', name: 'System Admin', role: 'ADMIN', password: hashedPassword }
        });
        console.log('[Startup] Admin account verified and password reset to default.');

        // 2. Ensure Sample Customer and Data exists if DB is empty
        const deviceCount = await prisma.device.count();
        if (deviceCount === 0) {
            console.log('[Startup] Database is empty, seeding sample data...');
            
            const customer = await prisma.user.upsert({
                where: { email: 'customer@test.com' },
                update: {},
                create: {
                    email: 'customer@test.com',
                    name: 'John Doe',
                    role: 'CUSTOMER',
                    password: hashedPassword
                },
            });

            const device = await prisma.device.create({
                data: {
                    brand: 'Apple',
                    model: 'iPhone 15 Pro',
                    condition: 'Mint',
                    specs: { storage: '256GB', color: 'Natural Titanium' },
                    estimatedVal: 850,
                    userId: customer.id,
                }
            });

            await prisma.ticket.create({
                data: {
                    deviceId: device.id,
                    customerId: customer.id,
                    status: 'PRICING_ESTIMATED',
                    slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                    isUrgent: false,
                }
            });
            console.log('[Startup] Sample data seeded successfully.');
        } else {
            console.log('[Startup] Database has existing data, skipping sample seed.');
        }
    } catch (error: any) {
        console.error('[Startup] Failed to ensure database state:', error.message);
    }
}

// Trigger auto-seed (runs once when Vercel or Node.js loads this module)
ensureAdmin();

// Export for Vercel
export default app;

// Only listen if not running on Vercel (Vercel handles the listener as a serverless function)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(port, async () => {
        await ensureAdmin();
        console.log(`Lotsitems API is running on port ${port}`);
    });
}
