const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const path = require('path');

async function runMigrations() {
    console.log('🔄 Starting database migrations...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Disable SSL for Coolify PostgreSQL
    });

    const db = drizzle(pool);

    try {
        await migrate(db, {
            migrationsFolder: path.join(__dirname, '../lib/db/migrations'),
        });
        console.log('✅ Database migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
