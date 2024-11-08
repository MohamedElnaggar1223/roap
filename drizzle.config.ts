import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: './db/schema.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        host: 'localhost',
        user: 'root',
        password: process.env.DB_PASSWORD,
        database: 'roap',
        port: 3306
    }
})