import { NextRequest, NextResponse } from 'next/server';
import { db, waitForDatabaseConnection } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Checking users in database...');

        // Wait for database connection
        const isConnected = await waitForDatabaseConnection();
        if (!isConnected || !db) {
            return NextResponse.json({
                error: 'Database not connected or connection timeout',
                users: [],
                count: 0
            }, { status: 500 });
        }

        // Check if users table exists and has data
        const userList = await db.select().from(users);

        console.log(`📊 Found ${userList.length} users in database`);

        return NextResponse.json({
            success: true,
            users: userList.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
                roles: user.roles,
                department_id: user.department_id
            })),
            count: userList.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error checking users:', error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            users: [],
            count: 0
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('🌱 Seeding database with users...');

        // Wait for database connection
        const isConnected = await waitForDatabaseConnection();
        if (!isConnected || !db) {
            return NextResponse.json({
                error: 'Database not connected or connection timeout'
            }, { status: 500 });
        }

        // Check if users already exist
        const existingUsers = await db.select().from(users).limit(1);

        if (existingUsers.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Database already has users',
                count: existingUsers.length
            });
        }

        // Seed the database
        const { execSync } = require('child_process');
        execSync('npm run db:seed', { stdio: 'inherit' });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully'
        });

    } catch (error) {
        console.error('❌ Error seeding database:', error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
