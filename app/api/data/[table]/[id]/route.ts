import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { table: string; id: string } }
) {
    try {
        const { table, id } = params;
        const result = await storage.getById(table, id);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { table: string; id: string } }
) {
    try {
        const { table, id } = params;
        const data = await request.json();
        const result = await storage.update(table, id, data);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { table: string; id: string } }
) {
    try {
        const { table, id } = params;
        await storage.delete(table, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
