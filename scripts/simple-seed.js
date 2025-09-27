const { Pool } = require('pg');

async function seedDatabase() {
    console.log('🌱 Starting simple database seeding...');

    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Disable SSL for Coolify PostgreSQL
    });

    const client = await pool.connect();

    try {
        // Check if data already exists
        const existingUsers = await client.query('SELECT id FROM users LIMIT 1');
        if (existingUsers.rows.length > 0) {
            console.log('📋 Database already seeded, skipping...');
            return;
        }

        const timestamp = new Date().toISOString();

        // Create departments
        console.log('🏢 Creating departments...');
        const deptQueries = [
            ['Information Technology', 'IT'],
            ['Human Resources', 'HR'],
            ['Finance', 'FIN'],
            ['Operations', 'OPS'],
            ['Marketing', 'MKT']
        ];

        const departments = {};
        for (const [name, code] of deptQueries) {
            const result = await client.query(
                'INSERT INTO departments (name, code, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id, code',
                [name, code, timestamp, timestamp]
            );
            departments[code] = result.rows[0];
        }

        // Create categories
        console.log('📂 Creating categories...');
        const categoryQueries = [
            ['Internal Memos', true],
            ['Project Proposals', true],
            ['Expense Reports', true],
            ['Policy Updates', true],
            ['Budget Requests', true]
        ];

        const categories = {};
        for (const [name, isActive] of categoryQueries) {
            const result = await client.query(
                'INSERT INTO categories (name, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id, name',
                [name, isActive, timestamp, timestamp]
            );
            categories[name] = result.rows[0];
        }

        // Create permissions
        console.log('🔐 Creating permissions...');
        const permissionQueries = [
            ['create_eon', 'Create new eON documents', 'eon'],
            ['edit_eon', 'Edit eON documents', 'eon'],
            ['approve_eon', 'Approve eON documents', 'eon'],
            ['view_all_eons', 'View all eON documents', 'eon'],
            ['manage_users', 'Manage user accounts', 'admin'],
            ['manage_categories', 'Manage categories', 'admin'],
            ['view_audit_logs', 'View audit logs', 'admin']
        ];

        const permissions = {};
        for (const [name, description, module] of permissionQueries) {
            const result = await client.query(
                'INSERT INTO permissions (name, description, module, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, name',
                [name, description, module, timestamp, timestamp]
            );
            permissions[name] = result.rows[0];
        }

        // Create roles
        console.log('👥 Creating roles...');
        const roleQueries = [
            ['Admin', ['create_eon', 'edit_eon', 'approve_eon', 'view_all_eons', 'manage_users', 'manage_categories', 'view_audit_logs']],
            ['Manager', ['create_eon', 'edit_eon', 'approve_eon', 'view_all_eons']],
            ['Employee', ['create_eon', 'edit_eon']],
            ['Viewer', []]
        ];

        const roles = {};
        for (const [name, permissionNames] of roleQueries) {
            const result = await client.query(
                'INSERT INTO roles (name, permissions, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id, name',
                [name, JSON.stringify(permissionNames), timestamp, timestamp]
            );
            roles[name] = result.rows[0];
        }

        // Create users
        console.log('👤 Creating users...');
        const userQueries = [
            ['john.smith@company.com', 'John Smith', departments.FIN.id, ['Admin'], 'active'],
            ['jane.doe@company.com', 'Jane Doe', departments.HR.id, ['Manager'], 'active'],
            ['alex.chen@company.com', 'Alex Chen', departments.IT.id, ['Employee'], 'active'],
            ['sarah.wilson@company.com', 'Sarah Wilson', departments.HR.id, ['Manager'], 'active'],
            ['mike.johnson@company.com', 'Mike Johnson', departments.FIN.id, ['Employee'], 'active']
        ];

        const users = {};
        for (const [email, name, departmentId, roleNames, status] of userQueries) {
            const result = await client.query(
                'INSERT INTO users (email, name, department_id, roles, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email',
                [email, name, departmentId, JSON.stringify(roleNames), status, timestamp, timestamp]
            );
            users[email] = result.rows[0];
        }

        console.log('✅ Database seeding completed successfully!');
        console.log(`📊 Created: ${Object.keys(departments).length} departments, ${Object.keys(categories).length} categories, ${Object.keys(permissions).length} permissions, ${Object.keys(roles).length} roles, ${Object.keys(users).length} users`);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);

        if (error.message.includes('password authentication failed')) {
            console.error('\n🔧 Database Authentication Error - Please check:');
            console.error('1. DATABASE_URL format: postgresql://username:password@host:port/database');
            console.error('2. Username and password are correct');
            console.error('3. Database exists and user has permissions');
            console.error('4. For Coolify: Use service name "postgres" as hostname');
        }

        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();
