import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { email: string } }
) {
    try {
        const { email } = params;
        const result = await storage.getUserByEmail(decodeURIComponent(email));
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
