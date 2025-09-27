import { Pool } from 'pg';

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string; tables?: string[] }> {
    if (!process.env.DATABASE_URL) {
        return { healthy: false, error: 'DATABASE_URL not set' };
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
    });

    try {
        const client = await pool.connect();

        // Test basic connection
        await client.query('SELECT 1');

        // Check if tables exist
        const tableResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        const tables = tableResult.rows.map(row => row.table_name);

        client.release();
        await pool.end();

        return { healthy: true, tables };
    } catch (error) {
        await pool.end();
        return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function waitForDatabase(maxRetries = 10, delayMs = 2000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        const health = await checkDatabaseHealth();
        if (health.healthy) {
            console.log('✅ Database is healthy');
            if (health.tables) {
                console.log(`📊 Found tables: ${health.tables.join(', ')}`);
            }
            return true;
        }

        console.log(`⏳ Database not ready (attempt ${i + 1}/${maxRetries}): ${health.error}`);
        if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    console.error('❌ Database health check failed after all retries');
    return false;
}
