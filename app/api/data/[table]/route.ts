import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { table: string } }
) {
    try {
        const { table } = params;
        const result = await storage.getAll(table);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
