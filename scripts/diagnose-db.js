#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🔍 eON Database Diagnostic Tool');
console.log('================================\n');

async function diagnoseDatabase() {
    console.log('1. Environment Variables Check');
    console.log('-------------------------------');

    const requiredVars = ['DATABASE_URL', 'NODE_ENV', 'PORT'];
    const missingVars = [];

    for (const varName of requiredVars) {
        if (process.env[varName]) {
            if (varName === 'DATABASE_URL') {
                // Mask password in output
                const url = new URL(process.env[varName]);
                const maskedUrl = `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`;
                console.log(`✅ ${varName}: ${maskedUrl}`);
            } else {
                console.log(`✅ ${varName}: ${process.env[varName]}`);
            }
        } else {
            console.log(`❌ ${varName}: NOT SET`);
            missingVars.push(varName);
        }
    }

    if (missingVars.length > 0) {
        console.log(`\n⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
        console.log('Please set these variables in your Coolify application settings.\n');
    }

    console.log('\n2. DATABASE_URL Validation');
    console.log('---------------------------');

    if (!process.env.DATABASE_URL) {
        console.log('❌ DATABASE_URL not set - cannot proceed with database tests');
        return;
    }

    try {
        const url = new URL(process.env.DATABASE_URL);
        console.log(`✅ URL format valid`);
        console.log(`   Protocol: ${url.protocol}`);
        console.log(`   Hostname: ${url.hostname}`);
        console.log(`   Port: ${url.port}`);
        console.log(`   Database: ${url.pathname.substring(1)}`);
        console.log(`   Username: ${url.username}`);

        // Check for Coolify-specific requirements
        if (url.hostname === 'postgres') {
            console.log('✅ Hostname is "postgres" (correct for Coolify)');
        } else if (url.hostname === 'localhost') {
            console.log('⚠️  Hostname is "localhost" (may not work in Coolify)');
        } else {
            console.log(`⚠️  Hostname is "${url.hostname}" (verify this is correct for your setup)`);
        }

        if (url.port === '5432') {
            console.log('✅ Port is 5432 (standard PostgreSQL port)');
        } else {
            console.log(`⚠️  Port is ${url.port} (verify this is correct)`);
        }

    } catch (error) {
        console.log(`❌ Invalid DATABASE_URL format: ${error.message}`);
        console.log('Expected format: postgresql://username:password@host:port/database');
        return;
    }

    console.log('\n3. Database Connection Test');
    console.log('----------------------------');

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
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('🔄 Attempting to connect...');
        const client = await pool.connect();
        console.log('✅ Database connection successful');

        // Test basic query
        const result = await client.query('SELECT version()');
        console.log(`✅ Database version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

        client.release();

    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);

        if (error.message.includes('password authentication failed')) {
            console.log('\n🔧 Authentication Error - Check:');
            console.log('1. Username and password are correct');
            console.log('2. User exists in PostgreSQL');
            console.log('3. User has proper permissions');
        } else if (error.message.includes('does not exist')) {
            console.log('\n🔧 Database Error - Check:');
            console.log('1. Database name is correct');
            console.log('2. Database exists in PostgreSQL service');
            console.log('3. Database was created successfully');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 Connection Error - Check:');
            console.log('1. PostgreSQL service is running in Coolify');
            console.log('2. Service name is "postgres"');
            console.log('3. Port is 5432');
            console.log('4. Services are in the same network');
        }

        await pool.end();
        return;
    }

    console.log('\n4. Database Schema Check');
    console.log('-------------------------');

    try {
        const client = await pool.connect();

        // Check if tables exist
        const tableResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        const expectedTables = ['users', 'departments', 'categories', 'roles', 'permissions', 'eons'];
        const existingTables = tableResult.rows.map(row => row.table_name);

        console.log(`📊 Found ${existingTables.length} tables in database`);

        for (const table of expectedTables) {
            if (existingTables.includes(table)) {
                console.log(`✅ Table "${table}" exists`);
            } else {
                console.log(`❌ Table "${table}" missing`);
            }
        }

        if (existingTables.length === 0) {
            console.log('\n⚠️  No tables found - database needs to be migrated');
            console.log('Run: npm run db:migrate');
        } else if (existingTables.length < expectedTables.length) {
            console.log('\n⚠️  Some tables missing - database may need migration');
            console.log('Run: npm run db:migrate');
        } else {
            console.log('\n✅ All required tables exist');
        }

        // Check if data exists
        if (existingTables.includes('users')) {
            const userCount = await client.query('SELECT COUNT(*) FROM users');
            console.log(`📊 Users in database: ${userCount.rows[0].count}`);

            if (userCount.rows[0].count === '0') {
                console.log('⚠️  No users found - database may need seeding');
                console.log('Run: npm run db:seed');
            }
        }

        client.release();

    } catch (error) {
        console.log(`❌ Schema check failed: ${error.message}`);
    }

    console.log('\n5. Migration Files Check');
    console.log('-------------------------');

    const migrationPath = path.join(__dirname, '../lib/db/migrations/0000_initial.sql');
    if (fs.existsSync(migrationPath)) {
        console.log('✅ Migration file exists');
        const migrationContent = fs.readFileSync(migrationPath, 'utf8');
        const tableCount = (migrationContent.match(/CREATE TABLE/g) || []).length;
        console.log(`📊 Migration creates ${tableCount} tables`);
    } else {
        console.log('❌ Migration file not found');
    }

    console.log('\n6. Application Files Check');
    console.log('---------------------------');

    const requiredFiles = [
        'lib/db/connection.ts',
        'lib/db/storage.ts',
        'lib/storage.tsx',
        'scripts/simple-migrate.js',
        'scripts/simple-seed.js'
    ];

    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
        }
    }

    await pool.end();

    console.log('\n7. Recommendations');
    console.log('-------------------');

    if (missingVars.length > 0) {
        console.log('🔧 Set missing environment variables in Coolify');
    }

    if (existingTables.length === 0) {
        console.log('🔧 Run database migration: npm run db:migrate');
    }

    if (existingTables.includes('users')) {
        const userCount = await pool.query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: '0' }] }));
        if (userCount.rows[0].count === '0') {
            console.log('🔧 Seed database: npm run db:seed');
        }
    }

    console.log('\n✅ Diagnostic complete!');
    console.log('If issues persist, check Coolify logs and service status.');
}

// Run diagnostic
diagnoseDatabase().catch(error => {
    console.error('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
});
