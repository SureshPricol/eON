import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Enhanced database connection for Coolify
class DatabaseConnection {
  private pool: Pool | null = null;
  private db: any = null;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;

    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.warn(
        '⚠️  DATABASE_URL environment variable is not set. ' +
        'Database operations will use fallback storage. ' +
        'Please set DATABASE_URL in your environment variables. ' +
        'Format: postgresql://username:password@host:port/database'
      );
      return;
    }

    try {
      console.log('🔄 Initializing database connection...');

      // Parse DATABASE_URL for validation
      const url = new URL(process.env.DATABASE_URL);
      console.log(`📊 Connecting to: ${url.protocol}//${url.hostname}:${url.port}${url.pathname}`);

      // SSL configuration for different environments
      let sslConfig = false;
      if (process.env.NODE_ENV === 'production' && process.env.SSL_MODE === 'require') {
        sslConfig = { rejectUnauthorized: false };
      } else if (process.env.SSL_MODE === 'disable') {
        sslConfig = false;
      } else {
        // Auto-detect SSL requirement
        sslConfig = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
      }

      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      });

      // Add connection error handling
      this.pool.on('error', (err) => {
        console.error('Database connection error:', err);
        this.handleConnectionError(err);
      });

      this.pool.on('connect', () => {
        console.log('✅ New database client connected');
      });

      this.pool.on('remove', () => {
        console.log('📤 Database client removed from pool');
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.db = drizzle(this.pool, { schema });
      this.isInitialized = true;
      console.log('✅ Database connection initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error);
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any) {
    if (error.message.includes('password authentication failed')) {
      console.error(
        '❌ Database authentication failed. Please check:\n' +
        '1. DATABASE_URL format: postgresql://username:password@host:port/database\n' +
        '2. Username and password are correct\n' +
        '3. Database exists and user has permissions\n' +
        '4. For Coolify: Use service name "postgres" as hostname\n' +
        '5. Example: postgresql://eon_user:your_password@postgres:5432/eon_db'
      );
    } else if (error.message.includes('does not exist')) {
      console.error(
        '❌ Database does not exist. Please check:\n' +
        '1. Database name in DATABASE_URL is correct\n' +
        '2. Database service is running in Coolify\n' +
        '3. Database was created successfully'
      );
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error(
        '❌ Connection refused. Please check:\n' +
        '1. PostgreSQL service is running in Coolify\n' +
        '2. Service name is correct (should be "postgres")\n' +
        '3. Port is correct (5432)\n' +
        '4. Services are in the same network'
      );
    }

    // Retry logic for transient errors
    if (this.retryCount < this.maxRetries && !error.message.includes('password authentication failed')) {
      this.retryCount++;
      console.log(`🔄 Retrying database connection (attempt ${this.retryCount}/${this.maxRetries})...`);
      setTimeout(() => {
        this.initialize();
      }, 5000 * this.retryCount); // Exponential backoff
    } else {
      console.error('❌ Max retry attempts reached. Database connection failed.');
      this.pool = null;
      this.db = null;
    }
  }

  public getDb() {
    return this.db;
  }

  public getPool() {
    return this.pool;
  }

  public isConnected() {
    return this.isInitialized && this.db !== null && this.pool !== null;
  }

  public async waitForConnection(timeout = 10000) {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationPromise) {
      try {
        await Promise.race([
          this.initializationPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), timeout)
          )
        ]);
        return this.isInitialized;
      } catch (error) {
        console.error('❌ Database connection timeout:', error);
        return false;
      }
    }

    return false;
  }

  public async testConnection() {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const client = await this.pool!.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  public async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
      this.isInitialized = false;
      console.log('📤 Database connection closed');
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

// Export the database instance with proper initialization
export const db = dbConnection.getDb();

// Export connection utilities
export const isDatabaseConnected = () => dbConnection.isConnected();
export const testDatabaseConnection = () => dbConnection.testConnection();
export const closeDatabaseConnection = () => dbConnection.close();
export const waitForDatabaseConnection = () => dbConnection.waitForConnection();

// Wait for database connection to be established
setTimeout(() => {
  if (dbConnection.isConnected()) {
    console.log('✅ Database connection established and ready');
  } else {
    console.log('⚠️  Database connection not yet established');
  }
}, 2000);

export type Database = typeof db;
