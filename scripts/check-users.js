const { Pool } = require('pg');

async function checkUsers() {
    console.log('🔍 Checking users in database...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
    });

    const client = await pool.connect();

    try {
        // Check if users table exists
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('❌ Users table does not exist');
            return;
        }

        // Get all users
        const usersResult = await client.query('SELECT * FROM users ORDER BY email');
        console.log(`📊 Found ${usersResult.rows.length} users in database:`);
        
        usersResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.name}) - ${user.status}`);
            console.log(`   Roles: ${user.roles}`);
            console.log(`   Department ID: ${user.department_id}`);
        });

        // Check departments
        const deptResult = await client.query('SELECT * FROM departments ORDER BY code');
        console.log(`\n🏢 Found ${deptResult.rows.length} departments:`);
        
        deptResult.rows.forEach((dept, index) => {
            console.log(`${index + 1}. ${dept.code} - ${dept.name} (ID: ${dept.id})`);
        });

    } catch (error) {
        console.error('❌ Error checking users:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUsers();
