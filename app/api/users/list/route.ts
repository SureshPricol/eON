import { NextRequest, NextResponse } from 'next/server';
import { db, waitForDatabaseConnection } from '@/lib/db/connection';
import { users, departments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        console.log('👥 Fetching user list...');

        // Wait for database connection
        const isConnected = await waitForDatabaseConnection();
        if (!isConnected || !db) {
            return NextResponse.json({
                success: false,
                error: 'Database not connected or connection timeout',
                users: []
            }, { status: 500 });
        }

        // Get all users with their department information
        const userList = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                status: users.status,
                roles: users.roles,
                department_id: users.department_id,
                department_name: departments.name,
                department_code: departments.code,
                created_at: users.created_at,
                updated_at: users.updated_at
            })
            .from(users)
            .leftJoin(departments, eq(users.department_id, departments.id));

        console.log(`📊 Found ${userList.length} users in database`);

        // Format the response
        const formattedUsers = userList.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
            roles: user.roles,
            department: {
                id: user.department_id,
                name: user.department_name,
                code: user.department_code
            },
            created_at: user.created_at,
            updated_at: user.updated_at
        }));

        return NextResponse.json({
            success: true,
            count: userList.length,
            users: formattedUsers,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching user list:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            users: []
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
                success: false,
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
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
