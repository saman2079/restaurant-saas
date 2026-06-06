import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../db/schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export async function connectDB() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL متصل شد');
  } catch (error) {
    console.error('❌ خطا در اتصال به PostgreSQL:', error);
    process.exit(1);
  }
}