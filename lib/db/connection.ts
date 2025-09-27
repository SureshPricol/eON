import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. ' +
    'Please set it in your environment variables. ' +
    'Format: postgresql://username:password@host:port/database'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for Coolify PostgreSQL
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Database connection error:', err);
  if (err.message.includes('password authentication failed')) {
    console.error(
      '❌ Database authentication failed. Please check:\n' +
      '1. DATABASE_URL format: postgresql://username:password@host:port/database\n' +
      '2. Username and password are correct\n' +
      '3. Database exists and user has permissions\n' +
      '4. For Coolify: Use service name "postgres" as hostname'
    );
  }
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
