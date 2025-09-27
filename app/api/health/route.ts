import { NextResponse } from 'next/server';
import { healthCheck } from '@/scripts/healthcheck';

export async function GET() {
  try {
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      return NextResponse.json({ 
        status: 'healthy', 
        message: 'Database is ready' 
      });
    } else {
      return NextResponse.json({ 
        status: 'unhealthy', 
        message: 'Database needs setup' 
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


