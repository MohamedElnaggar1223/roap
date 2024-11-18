// import { drizzle } from "drizzle-orm/mysql2";
// import mysql from "mysql2/promise";
// import * as schema from '@/db/schema'

// const connection = await mysql.createConnection({
//     host: process.env.DB_HOST!,
//     user: process.env.DB_USER!,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME!,
//     port: parseInt(process.env.DB_PORT!),
//     enableKeepAlive: true,
//     connectTimeout: 60000,
// });

// export const db = drizzle(connection, { schema, mode: 'default' })