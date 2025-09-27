import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/health';

export async function GET() {
    try {
        const health = await checkDatabaseHealth();

        if (health.healthy) {
            return NextResponse.json({
                status: 'healthy',
                tables: health.tables,
                message: 'Database connection successful'
            });
        } else {
            return NextResponse.json({
                status: 'unhealthy',
                error: health.error,
                message: 'Database connection failed'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Database health check failed:', error);
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Health check failed'
        }, { status: 500 });
    }
}
