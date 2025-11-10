import {migrate} from 'drizzle-orm/neon-http/migrator';
import {drizzle} from 'drizzle-orm/neon-http';
import {neon} from '@neondatabase/serverless';
import * as schema from './schema';
import 'dotenv/config';
import { log } from 'console';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined or is empty');
}

async function runMigration(){
  try{
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql, { schema })

    await migrate(db, {migrationsFolder: './drizzle'});
    console.log('Migrations applied successfully');
  }catch(error){
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}
runMigration();