import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined or is empty');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export * from './schema';