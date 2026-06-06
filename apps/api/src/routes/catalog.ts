import { Router } from 'express';
import { prisma } from '../db';
import { refreshDeviceCatalog } from '../services/catalogService';

const router = Router();

// GET /api/catalog/makes
router.get('/makes', async (req, res) => {
    try {
        const catalogs = await prisma.deviceCatalog.findMany({
            select: { make: true },
            distinct: ['make'],
            orderBy: { make: 'asc' },
        });
        const makes = catalogs.map((c: any) => c.make);
        res.json({ success: true, makes });
    } catch (error) {
        console.error('Error fetching makes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch makes' });
    }
});

// GET /api/catalog/models?make=Apple
router.get('/models', async (req, res) => {
    try {
        const { make } = req.query;
        if (!make) {
            return res.status(400).json({ success: false, error: 'Make is required' });
        }
        
        const catalogs = await prisma.deviceCatalog.findMany({
            where: { make: String(make) },
            select: { model: true },
            distinct: ['model'],
            orderBy: { model: 'asc' },
        });
        const models = catalogs.map((c: any) => c.model);
        res.json({ success: true, models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch models' });
    }
});

// GET /api/catalog/storage?make=Apple&model=iPhone+15
router.get('/storage', async (req, res) => {
    try {
        const { make, model } = req.query;
        if (!make || !model) {
            return res.status(400).json({ success: false, error: 'Make and model are required' });
        }
        
        const catalogs = await prisma.deviceCatalog.findMany({
            where: { make: String(make), model: String(model) },
            select: { storage: true },
            distinct: ['storage'],
            orderBy: { storage: 'asc' },
        });
        const storageOptions = catalogs.map((c: any) => c.storage);
        res.json({ success: true, storageOptions });
    } catch (error) {
        console.error('Error fetching storage options:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch storage options' });
    }
});

// Seed catalog for testing
router.post('/seed', async (req, res) => {
    try {
        await prisma.deviceCatalog.createMany({
            data: [
                { make: 'Apple', model: 'iPhone 15 Pro', storage: '128GB' },
                { make: 'Apple', model: 'iPhone 15 Pro', storage: '256GB' },
                { make: 'Apple', model: 'iPhone 15 Pro', storage: '512GB' },
                { make: 'Apple', model: 'iPhone 14', storage: '128GB' },
                { make: 'Apple', model: 'iPhone 14', storage: '256GB' },
                { make: 'Samsung', model: 'Galaxy S24 Ultra', storage: '256GB' },
                { make: 'Samsung', model: 'Galaxy S24 Ultra', storage: '512GB' },
                { make: 'Google', model: 'Pixel 8 Pro', storage: '128GB' },
                { make: 'Google', model: 'Pixel 8 Pro', storage: '256GB' },
            ],
            skipDuplicates: true,
        });
        res.json({ success: true, message: 'Catalog seeded' });
    } catch (error) {
        console.error('Error seeding catalog:', error);
        res.status(500).json({ success: false, error: 'Failed to seed catalog' });
    }
});

// POST /api/catalog/refresh
router.post('/refresh', async (req, res) => {
    try {
        const result = await refreshDeviceCatalog();
        res.json({ success: true, message: 'Device catalog refreshed successfully', ...result });
    } catch (error: any) {
        console.error('Error refreshing device catalog via API:', error);
        res.status(500).json({ success: false, error: 'Failed to refresh device catalog', details: error.message });
    }
});

export default router;

