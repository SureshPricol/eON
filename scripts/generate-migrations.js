const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Generating database migrations...');

try {
    // Generate migrations using drizzle-kit
    execSync('npx drizzle-kit generate', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
    });

    console.log('✅ Migrations generated successfully!');
    console.log('📁 Check the lib/db/migrations folder for generated files');
} catch (error) {
    console.error('❌ Migration generation failed:', error.message);
    process.exit(1);
}
