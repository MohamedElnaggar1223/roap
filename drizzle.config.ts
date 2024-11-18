import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
    schema: './db/schema.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.SUPABASE_DATABASE_URL!,
        host: process.env.SUPABASE_DATABASE_HOST!,
        port: parseInt(process.env.SUPABASE_DATABASE_PORT!),
        user: process.env.SUPABASE_DATABASE_USER!,
        password: process.env.SUPABASE_DATABASE_PASSWORD!,
        database: process.env.SUPABASE_DATABASE_NAME!,
    }
});
