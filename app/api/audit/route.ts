import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function POST(request: NextRequest) {
    try {
        const { action, userId, entityId, details } = await request.json();
        await storage.logAction(action, userId, entityId, details);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
