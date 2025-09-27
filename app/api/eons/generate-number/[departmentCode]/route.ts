import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { departmentCode: string } }
) {
    try {
        const { departmentCode } = params;
        const result = await storage.generateEONNumber(decodeURIComponent(departmentCode));
        return NextResponse.json({ number: result });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
