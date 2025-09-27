const { execSync } = require('child_process');
const { healthCheck } = require('./healthcheck');

async function startup() {
  console.log('🚀 Application startup sequence...');
  
  try {
    // Wait a bit for database to be ready
    console.log('⏳ Waiting for database...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check database health
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      console.log('🔄 Database not ready, running migrations...');
      
      try {
        // Run migrations
        execSync('npm run db:migrate', { stdio: 'inherit' });
        console.log('✅ Migrations completed');
        
        // Run seed data
        execSync('npm run db:seed', { stdio: 'inherit' });
        console.log('✅ Seeding completed');
        
      } catch (error) {
        console.error('❌ Migration/seed failed:', error.message);
        // Continue anyway - app might still work
      }
    }
    
    console.log('✅ Startup sequence completed');
  } catch (error) {
    console.error('❌ Startup sequence failed:', error.message);
    // Continue anyway
  }
}

// Run startup if called directly
if (require.main === module) {
  startup();
}

module.exports = { startup };

