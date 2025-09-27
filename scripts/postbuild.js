const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Post-build: Running database setup...');

try {
  // Run migrations
  console.log('📊 Running database migrations...');
  execSync('npm run db:migrate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  
  // Run seed data
  console.log('🌱 Seeding database...');
  execSync('npm run db:seed', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  
  console.log('✅ Database setup completed successfully!');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  // Don't exit with error code to allow build to continue
  console.log('⚠️  Continuing with build despite database setup failure');
}

