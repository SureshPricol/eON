import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('[Test] Testing storage import...');
        
        // Test direct import
        let storage;
        try {
            const dbStorageModule = require('@/lib/db/storage');
            storage = dbStorageModule.storage;
            console.log('[Test] Direct import successful');
        } catch (error) {
            console.error('[Test] Direct import failed:', error);
            return NextResponse.json({ 
                error: 'Direct import failed', 
                details: error.message 
            }, { status: 500 });
        }

        // Test storage object
        if (!storage) {
            console.error('[Test] Storage object is null/undefined');
            return NextResponse.json({ 
                error: 'Storage object is null/undefined' 
            }, { status: 500 });
        }

        // Test storage methods
        const methods = Object.keys(storage);
        console.log('[Test] Available methods:', methods);

        if (!methods.includes('getAll')) {
            console.error('[Test] getAll method missing');
            return NextResponse.json({ 
                error: 'getAll method missing',
                availableMethods: methods
            }, { status: 500 });
        }

        // Test database connection
        try {
            const result = await storage.getAll('users');
            console.log('[Test] Database query successful, got', result.length, 'users');
            return NextResponse.json({ 
                success: true, 
                userCount: result.length,
                availableMethods: methods
            });
        } catch (dbError) {
            console.error('[Test] Database query failed:', dbError);
            return NextResponse.json({ 
                error: 'Database query failed', 
                details: dbError.message,
                availableMethods: methods
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[Test] Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Unexpected error', 
            details: error.message 
        }, { status: 500 });
    }
}
