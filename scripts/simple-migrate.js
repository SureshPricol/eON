const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSimpleMigrations() {
    console.log('🔄 Starting simple database migrations...');

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
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runSimpleMigrations();
