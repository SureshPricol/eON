import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST() {
  try {
    console.log('🔄 Running database setup via API...');
    
    // Run migrations
    execSync('npm run db:migrate', { 
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    // Run seed data
    execSync('npm run db:seed', { 
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database setup completed successfully' 
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


