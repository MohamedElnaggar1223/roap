// import { mysqlTable, text, int, timestamp, boolean } from "drizzle-orm/mysql-core";
			
// export const user = mysqlTable("users", {
// 					id: text("id").primaryKey(),
// 					name: text('name').notNull(),
//  email: text('email').notNull().unique(),
//  emailVerified: boolean('emailVerified').notNull(),
//  image: text('image'),
//  createdAt: timestamp('createdAt').notNull(),
//  updatedAt: timestamp('updatedAt').notNull(),
//  phone_number: text('phone_number').unique(),
//  google_id: text('google_id'),
//  apple_id: text('apple_id'),
//  is_athletic: int('is_athletic').notNull(),
//  email_verified_at: timestamp('email_verified_at'),
//  password: text('password'),
//  remember_token: text('remember_token'),
//  device_token: text('device_token'),
//  stripe_id: text('stripe_id'),
//  pm_type: text('pm_type'),
//  pm_last_four: text('pm_last_four'),
//  trial_ends_at: timestamp('trial_ends_at'),
//  deleted_at: timestamp('deleted_at'),
//  created_at: timestamp('created_at'),
//  updated_at: timestamp('updated_at'),
//  role: text('role')
// 				});

// export const session = mysqlTable("session", {
// 					id: text("id").primaryKey(),
// 					expiresAt: timestamp('expiresAt').notNull(),
//  ipAddress: text('ipAddress'),
//  userAgent: text('userAgent'),
//  userId: text('userId').notNull().references(()=> users.id)
// 				});

// export const account = mysqlTable("accounts", {
// 					id: text("id").primaryKey(),
// 					accountId: text('accountId').notNull(),
//  providerId: text('providerId').notNull(),
//  userId: text('userId').notNull().references(()=> users.id),
//  accessToken: text('accessToken'),
//  refreshToken: text('refreshToken'),
//  idToken: text('idToken'),
//  expiresAt: timestamp('expiresAt'),
//  password: text('password')
// 				});

// export const verification = mysqlTable("verification", {
// 					id: text("id").primaryKey(),
// 					identifier: text('identifier').notNull(),
//  value: text('value').notNull(),
//  expiresAt: timestamp('expiresAt').notNull()
// 				});
