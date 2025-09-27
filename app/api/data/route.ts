import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function POST(request: NextRequest) {
    try {
        const { action, table, data } = await request.json();

        if (action === 'create') {
            const result = await storage.create(table, data);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
