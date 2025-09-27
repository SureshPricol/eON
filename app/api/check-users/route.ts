import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Checking users in database...');

        // Check if database is connected
        if (!db) {
            return NextResponse.json({
                error: 'Database not connected',
                users: [],
                count: 0
            }, { status: 500 });
        }

        // Check if users table exists and has data
        const userList = await db.select().from(users).limit(10);

        console.log(`📊 Found ${userList.length} users in database`);

        return NextResponse.json({
            success: true,
            users: userList.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status
            })),
            count: userList.length
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

        // Check if database is connected
        if (!db) {
            return NextResponse.json({
                error: 'Database not connected'
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
