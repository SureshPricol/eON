import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { creatorId: string } }
) {
    try {
        const { creatorId } = params;
        const result = await storage.getEONsByCreator(creatorId);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
