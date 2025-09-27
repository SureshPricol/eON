import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for Coolify PostgreSQL
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
