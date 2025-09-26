import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

// Initialize database on startup in production
if (process.env.NODE_ENV === 'production') {
  import('./init').then(({ initializeDatabase }) => {
    initializeDatabase().catch(console.error);
  });
}
