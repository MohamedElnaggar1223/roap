import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: './db/schema.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME!,
        port: parseInt(process.env.DB_PORT!)
    },
})