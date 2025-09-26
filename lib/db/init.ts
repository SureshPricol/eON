import { db } from './connection';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('🔄 Initializing database...');
    
    // Run migrations
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'lib/db/migrations'),
    });
    
    console.log('✅ Database migrations completed');
    
    // Check if we need to seed data
    const { users } = await import('./schema');
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('🌱 Seeding database...');
      const { execSync } = await import('child_process');
      execSync('npm run db:seed', { stdio: 'inherit' });
      console.log('✅ Database seeding completed');
    }
    
    isInitialized = true;
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
