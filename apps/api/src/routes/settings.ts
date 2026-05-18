import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Basic Admin Check Middleware (Mocked for this prototype, checking 'role' from headers or assuming single admin)
// In a real app, use the actual JWT authentication middleware
const requireAdmin = async (req: Request, res: Response, next: Function) => {
    // For now, we allow the request to pass through so the UI can be tested, 
    // but in production, you'd verify req.user.role === 'ADMIN'
    next();
};

// Get all system settings
router.get('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSettings.findMany();
        
        // Convert to key-value object
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        res.json({ success: true, settings: settingsMap });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// Update a specific setting
router.put('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ success: false, error: 'Setting key is required' });
        }

        const setting = await prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        res.json({ success: true, setting });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ success: false, error: 'Failed to update setting' });
    }
});

export default router;
