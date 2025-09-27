const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq } = require('drizzle-orm');
const {
    users,
    departments,
    categories,
    roles,
    permissions
} = require('../lib/db/schema');

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Disable SSL for Coolify PostgreSQL
    });

    const db = drizzle(pool);

    try {
        // Check if data already exists
        const existingUsers = await db.select().from(users).limit(1);
        if (existingUsers.length > 0) {
            console.log('📋 Database already seeded, skipping...');
            return;
        }

        // Create departments
        console.log('🏢 Creating departments...');
        const [itDept] = await db.insert(departments).values({
            name: 'Information Technology',
            code: 'IT',
        }).returning();

        const [hrDept] = await db.insert(departments).values({
            name: 'Human Resources',
            code: 'HR',
        }).returning();

        const [financeDept] = await db.insert(departments).values({
            name: 'Finance',
            code: 'FIN',
        }).returning();

        // Create categories
        console.log('📂 Creating categories...');
        const [policyCategory] = await db.insert(categories).values({
            name: 'Policy',
            is_active: true,
        }).returning();

        const [procedureCategory] = await db.insert(categories).values({
            name: 'Procedure',
            is_active: true,
        }).returning();

        const [guidelineCategory] = await db.insert(categories).values({
            name: 'Guideline',
            is_active: true,
        }).returning();

        // Create permissions
        console.log('🔐 Creating permissions...');
        const [createDocPerm] = await db.insert(permissions).values({
            name: 'CREATE_DOCUMENT',
            description: 'Create new documents',
            module: 'documents',
        }).returning();

        const [editDocPerm] = await db.insert(permissions).values({
            name: 'EDIT_DOCUMENT',
            description: 'Edit documents',
            module: 'documents',
        }).returning();

        const [approveDocPerm] = await db.insert(permissions).values({
            name: 'APPROVE_DOCUMENT',
            description: 'Approve documents',
            module: 'documents',
        }).returning();

        const [manageUsersPerm] = await db.insert(permissions).values({
            name: 'MANAGE_USERS',
            description: 'Manage users',
            module: 'masters',
        }).returning();

        const [viewAuditPerm] = await db.insert(permissions).values({
            name: 'VIEW_AUDIT',
            description: 'View audit logs',
            module: 'audit',
        }).returning();

        // Create roles
        console.log('👥 Creating roles...');
        const [adminRole] = await db.insert(roles).values({
            name: 'Administrator',
            permissions: [
                createDocPerm.id,
                editDocPerm.id,
                approveDocPerm.id,
                manageUsersPerm.id,
                viewAuditPerm.id,
            ],
        }).returning();

        const [userRole] = await db.insert(roles).values({
            name: 'User',
            permissions: [
                createDocPerm.id,
                editDocPerm.id,
                approveDocPerm.id,
            ],
        }).returning();

        // Create users
        console.log('👤 Creating users...');
        const [adminUser] = await db.insert(users).values({
            email: 'admin@eon.com',
            name: 'System Administrator',
            department_id: itDept.id,
            roles: [adminRole.id],
            status: 'active',
        }).returning();

        const [johnUser] = await db.insert(users).values({
            email: 'john.doe@eon.com',
            name: 'John Doe',
            department_id: itDept.id,
            roles: [userRole.id],
            status: 'active',
        }).returning();

        const [janeUser] = await db.insert(users).values({
            email: 'jane.smith@eon.com',
            name: 'Jane Smith',
            department_id: hrDept.id,
            roles: [userRole.id],
            status: 'active',
        }).returning();

        const [bobUser] = await db.insert(users).values({
            email: 'bob.wilson@eon.com',
            name: 'Bob Wilson',
            department_id: financeDept.id,
            roles: [userRole.id],
            status: 'active',
        }).returning();

        console.log('✅ Database seeding completed successfully!');
        console.log('📧 Default users created:');
        console.log(`   - admin@eon.com (Administrator)`);
        console.log(`   - john.doe@eon.com (User)`);
        console.log(`   - jane.smith@eon.com (User)`);
        console.log(`   - bob.wilson@eon.com (User)`);
        console.log('🔑 Default password for all users: password123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedDatabase();
