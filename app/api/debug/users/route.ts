import { NextResponse } from 'next/server';
import { storage } from '@/lib/db/storage';

export async function GET() {
    try {
        console.log('[Debug] Getting all users from database...');
        const users = await storage.getAll('users');
        
        console.log(`[Debug] Retrieved ${users.length} users`);
        
        return NextResponse.json({
            count: users.length,
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
                roles: user.roles
            }))
        });
    } catch (error) {
        console.error('[Debug] Error getting users:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            count: 0,
            users: []
        }, { status: 500 });
    }
}
