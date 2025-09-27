const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSimpleMigrations() {
    console.log('🔄 Starting simple database migrations...');

    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required');
        console.error('Please set DATABASE_URL in your environment variables');
        console.error('Format: postgresql://username:password@host:port/database');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Disable SSL for Coolify PostgreSQL
    });

    try {
        // Read the SQL migration file
        const migrationPath = path.join(__dirname, '../lib/db/migrations/0000_initial.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await pool.query(migrationSQL);

        console.log('✅ Database migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);

        if (error.message.includes('password authentication failed')) {
            console.error('\n🔧 Database Authentication Error - Please check:');
            console.error('1. DATABASE_URL format: postgresql://username:password@host:port/database');
            console.error('2. Username and password are correct');
            console.error('3. Database exists and user has permissions');
            console.error('4. For Coolify: Use service name "postgres" as hostname');
            console.error('\nExample for Coolify:');
            console.error('DATABASE_URL=postgresql://eon_user:your_password@postgres:5432/eon_db');
        } else if (error.message.includes('does not exist')) {
            console.error('\n🔧 Database Connection Error - Please check:');
            console.error('1. Database service is running in Coolify');
            console.error('2. Database name exists');
            console.error('3. Network connectivity between services');
        }

        process.exit(1);
    } finally {
        await pool.end();
    }
}

runSimpleMigrations();
