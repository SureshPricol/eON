import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseConnected, testDatabaseConnection, waitForDatabaseConnection } from '@/lib/db/connection';
import { users, departments, categories, eons } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Running database health check...');

        // Wait for database connection
        const isConnected = await waitForDatabaseConnection();
        if (!isConnected) {
            return NextResponse.json({
                healthy: false,
                error: 'Database not connected or connection timeout',
                users: [],
                departments: [],
                categories: [],
                eons: []
            }, { status: 500 });
        }

        // Test database connection
        const connectionTest = await testDatabaseConnection();
        if (!connectionTest) {
            return NextResponse.json({
                healthy: false,
                error: 'Database connection test failed',
                users: [],
                departments: [],
                categories: [],
                eons: []
            }, { status: 500 });
        }

        // Get all users with their email IDs
        const userList = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            status: users.status,
            department_id: users.department_id
        }).from(users);

        // Get departments
        const departmentList = await db.select().from(departments);

        // Get categories
        const categoryList = await db.select().from(categories);

        // Get eons count
        const eonCount = await db.select().from(eons);

        console.log(`📊 Database Health Check Results:`);
        console.log(`   - Users: ${userList.length}`);
        console.log(`   - Departments: ${departmentList.length}`);
        console.log(`   - Categories: ${categoryList.length}`);
        console.log(`   - EONs: ${eonCount.length}`);

        return NextResponse.json({
            healthy: true,
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                connectionTest: true
            },
            users: userList.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
                department_id: user.department_id
            })),
            departments: departmentList.map(dept => ({
                id: dept.id,
                name: dept.name,
                code: dept.code
            })),
            categories: categoryList.map(cat => ({
                id: cat.id,
                name: cat.name,
                is_active: cat.is_active
            })),
            eons: {
                count: eonCount.length
            },
            summary: {
                total_users: userList.length,
                total_departments: departmentList.length,
                total_categories: categoryList.length,
                total_eons: eonCount.length
            }
        });

    } catch (error) {
        console.error('❌ Database health check failed:', error);

        return NextResponse.json({
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            users: [],
            departments: [],
            categories: [],
            eons: []
        }, { status: 500 });
    }
}