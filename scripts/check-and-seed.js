#!/usr/bin/env node

const { Pool } = require('pg');

async function checkAndSeed() {
    console.log('🔍 Checking database and seeding if needed...');

    // SSL configuration for different environments
    let sslConfig = false;
    if (process.env.NODE_ENV === 'production' && process.env.SSL_MODE === 'require') {
        sslConfig = { rejectUnauthorized: false };
    } else if (process.env.SSL_MODE === 'disable') {
        sslConfig = false;
    } else {
        sslConfig = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
    });

    try {
        const client = await pool.connect();

        // Check if users exist
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`📊 Users in database: ${userCount.rows[0].count}`);

        if (userCount.rows[0].count === '0') {
            console.log('🌱 No users found, seeding database...');

            // Run the seed script
            const { execSync } = require('child_process');
            execSync('npm run db:seed', { stdio: 'inherit' });

            console.log('✅ Database seeded successfully!');
        } else {
            console.log('✅ Database already has users, no seeding needed');

            // List existing users
            const users = await client.query('SELECT email, name FROM users LIMIT 5');
            console.log('👥 Existing users:');
            users.rows.forEach(user => {
                console.log(`   - ${user.email} (${user.name})`);
            });
        }

        client.release();

    } catch (error) {
        console.error('❌ Error checking/seeding database:', error.message);

        if (error.message.includes('relation "users" does not exist')) {
            console.log('🔄 Users table does not exist, running migrations...');
            const { execSync } = require('child_process');
            execSync('npm run db:migrate', { stdio: 'inherit' });
            console.log('✅ Migrations completed, now seeding...');
            execSync('npm run db:seed', { stdio: 'inherit' });
        }

    } finally {
        await pool.end();
    }
}

checkAndSeed().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
