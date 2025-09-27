const { Pool } = require('pg');

async function healthCheck() {
  console.log('🔍 Running database health check...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'departments', 'categories', 'eons')
    `);
    
    if (result.rows.length >= 4) {
      console.log('✅ Database tables exist');
      return true;
    } else {
      console.log('⚠️  Database tables missing, migrations needed');
      return false;
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run health check if called directly
if (require.main === module) {
  healthCheck().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { healthCheck };

