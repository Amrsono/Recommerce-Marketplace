import { prisma } from '../db';
import https from 'https';

const GOOGLE_CSV_URL = 'https://storage.googleapis.com/play_public/supported_devices.csv';
const APPLE_JSON_URL = 'https://raw.githubusercontent.com/fieldnotescommunities/ios-device-identifiers/master/ios-device-identifiers.json';

const TARGET_BRANDS = ['google', 'samsung', 'oneplus', 'sony', 'xiaomi', 'huawei'];

// Helper to fetch URL content as Buffer
function fetchBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                fetchBuffer(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}, status code: ${res.statusCode}`));
                return;
            }
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

// Parses a line of CSV, handles quotes and commas
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.replace(/^"|"$/g, '').trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
}

// Helper to clean model names
function cleanModelName(brand: string, model: string): string {
    let clean = model;
    
    // Remove brand prefix if present (e.g. "Google Pixel 8" -> "Pixel 8")
    const brandRegex = new RegExp(`^${brand}\\s+`, 'i');
    clean = clean.replace(brandRegex, '');

    // General cleaning
    clean = clean
        .replace(/\s*(?:\([^)]+\)|rev a|rev b|cellular|wifi|\d+(?:st|nd|rd|th) gen|\d+GB)\s*/gi, '')
        .trim();

    return clean;
}

// Determines storage sizes for a device model
function getStorageSizes(brand: string, model: string): string[] {
    const lowerModel = model.toLowerCase();
    const lowerBrand = brand.toLowerCase();

    if (lowerBrand === 'apple') {
        if (lowerModel.includes('pro max') || lowerModel.includes('ultra')) {
            return ['128GB', '256GB', '512GB', '1TB'];
        }
        if (lowerModel.includes('pro') || lowerModel.includes('air') || lowerModel.includes('mini')) {
            return ['64GB', '128GB', '256GB', '512GB'];
        }
        return ['64GB', '128GB', '256GB'];
    }

    // Samsung / Android High End
    if (lowerModel.includes('ultra') || lowerModel.includes('fold') || lowerModel.includes('flip')) {
        return ['256GB', '512GB', '1TB'];
    }
    if (lowerModel.includes('pro') || lowerModel.includes('+') || lowerModel.includes('plus')) {
        return ['128GB', '256GB', '512GB'];
    }
    // Budget models / Standard models
    return ['128GB', '256GB'];
}

export async function refreshDeviceCatalog(): Promise<{ added: number; total: number }> {
    console.log('[CatalogService] Starting device catalog refresh...');
    let addedCount = 0;

    try {
        // 1. Fetch Google supported devices CSV
        console.log('[CatalogService] Fetching Google Play supported devices CSV...');
        const googleBuffer = await fetchBuffer(GOOGLE_CSV_URL);
        
        // Google supported devices CSV is encoded in UTF-16LE with BOM
        let csvText = '';
        if (googleBuffer[0] === 0xff && googleBuffer[1] === 0xfe) {
            csvText = googleBuffer.toString('utf16le');
        } else {
            csvText = googleBuffer.toString('utf8');
        }

        const lines = csvText.split(/\r?\n/);
        console.log(`[CatalogService] Parsed ${lines.length} lines from Google CSV`);

        const androidDevicesToInsert: { make: string; model: string; storage: string }[] = [];

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const fields = parseCSVLine(line);
            if (fields.length < 4) continue;

            const retailBranding = fields[0]; // e.g. "Google"
            const marketingName = fields[1];  // e.g. "Pixel 8 Pro"
            const deviceCode = fields[2];     // e.g. "husky"
            const modelCode = fields[3];      // e.g. "GC3VE"

            if (!retailBranding) continue;

            const brandingLower = retailBranding.toLowerCase();
            if (TARGET_BRANDS.includes(brandingLower)) {
                // Determine display model name: marketing name is preferred, fallback to model code
                let rawModel = marketingName || modelCode || deviceCode;
                if (!rawModel) continue;

                // Capitalize brand name nicely
                const formattedBrand = retailBranding.charAt(0).toUpperCase() + retailBranding.slice(1).toLowerCase();
                const cleanedModel = cleanModelName(formattedBrand, rawModel);

                // Skip generic or weird model codes if we have a marketing name filter
                if (!cleanedModel || cleanedModel.length < 2 || /^[a-zA-Z0-9]{2,4}$/.test(cleanedModel)) {
                    continue;
                }

                const storages = getStorageSizes(formattedBrand, cleanedModel);
                for (const storage of storages) {
                    androidDevicesToInsert.push({
                        make: formattedBrand,
                        model: cleanedModel,
                        storage
                    });
                }
            }
        }

        // Deduplicate Android devices
        const uniqueAndroidDevices = androidDevicesToInsert.filter((item, idx, arr) =>
            idx === arr.findIndex(t => t.make === item.make && t.model === item.model && t.storage === item.storage)
        );

        console.log(`[CatalogService] Prepared ${uniqueAndroidDevices.length} unique Android make/model/storage variations`);

        // 2. Fetch Apple Devices JSON
        console.log('[CatalogService] Fetching Apple devices list JSON...');
        const appleBuffer = await fetchBuffer(APPLE_JSON_URL);
        const appleJson = JSON.parse(appleBuffer.toString('utf8'));

        const appleDevicesToInsert: { make: string; model: string; storage: string }[] = [];
        
        for (const [key, value] of Object.entries(appleJson)) {
            const modelName = value as string;
            // Only process iPhones and iPads
            if (modelName.startsWith('iPhone') || modelName.startsWith('iPad')) {
                const cleanedModel = cleanModelName('Apple', modelName);
                if (!cleanedModel || cleanedModel.toLowerCase().includes('simulator')) continue;

                const storages = getStorageSizes('Apple', cleanedModel);
                for (const storage of storages) {
                    appleDevicesToInsert.push({
                        make: 'Apple',
                        model: cleanedModel,
                        storage
                    });
                }
            }
        }

        // Deduplicate Apple devices
        const uniqueAppleDevices = appleDevicesToInsert.filter((item, idx, arr) =>
            idx === arr.findIndex(t => t.make === item.make && t.model === item.model && t.storage === item.storage)
        );

        console.log(`[CatalogService] Prepared ${uniqueAppleDevices.length} unique Apple make/model/storage variations`);

        // Combine all devices
        const allDevices = [...uniqueAndroidDevices, ...uniqueAppleDevices];

        // Batch insert or upsert
        // Since we have custom unique constraints, we can use prisma.deviceCatalog.createMany with skipDuplicates
        const batchSize = 100;
        for (let i = 0; i < allDevices.length; i += batchSize) {
            const batch = allDevices.slice(i, i + batchSize);
            const res = await prisma.deviceCatalog.createMany({
                data: batch,
                skipDuplicates: true
            });
            addedCount += res.count;
        }

        const totalCount = await prisma.deviceCatalog.count();
        console.log(`[CatalogService] Refresh complete. Added ${addedCount} new models/storages. Total catalog count: ${totalCount}`);
        
        return { added: addedCount, total: totalCount };
    } catch (error) {
        console.error('[CatalogService] Error refreshing device catalog:', error);
        throw error;
    }
}
