import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        status: 'ok',
        message: 'Next.js API is running',
        timestamp: new Date().toISOString()
    });
}
