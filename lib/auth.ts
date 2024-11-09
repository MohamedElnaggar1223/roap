// import { db } from "@/db";
// import { betterAuth } from "better-auth";
// import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import * as schema from "@/db/schema";
// import { sql } from "drizzle-orm";

// export const auth = betterAuth({
//     database: drizzleAdapter(db, {
//         provider: "mysql",
//         schema: {
//             ...schema,
//             user: schema.users,
//             session: schema.session,
//             account: schema.accounts,
//         },
//         generateId: () => {
//             sql`DEFAULT`
//         },
//     }),
//     secret: process.env.BETTER_AUTH_SECRET!,
//     emailAndPassword: {
//         enabled: true,
//         requireEmailVerification: false
//     },
//     user: {
//         modelName: 'users',
//         additionalFields: {
//             phone_number: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'phone_number',
//                 unique: true
//             },
//             google_id: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'google_id',
//             },
//             apple_id: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'apple_id'
//             },
//             is_athletic: {
//                 type: 'number',
//                 defaultValue: false,
//                 fieldName: 'is_athletic',
//                 required: true
//             },
//             email_verified_at: {
//                 type: 'date',
//                 defaultValue: null,
//                 fieldName: 'email_verified_at'
//             },
//             password: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'password'
//             },
//             remember_token: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'remember_token'
//             },
//             device_token: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'device_token'
//             },
//             stripe_id: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'stripe_id'
//             },
//             pm_type: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'pm_type'
//             },
//             pm_last_four: {
//                 type: 'string',
//                 defaultValue: null,
//                 fieldName: 'pm_last_four'
//             },
//             trial_ends_at: {
//                 type: 'date',
//                 defaultValue: null,
//                 fieldName: 'trial_ends_at'
//             },
//             deleted_at: {
//                 type: 'date',
//                 defaultValue: null,
//                 fieldName: 'deleted_at'
//             },
//             created_at: {
//                 type: 'date',
//                 defaultValue: null,
//                 fieldName: 'created_at'
//             },
//             updated_at: {
//                 type: 'date',
//                 defaultValue: null,
//                 fieldName: 'updated_at'
//             },
//             role: {
//                 type: 'string',
//                 defaultValue: 'user',
//                 fieldName: 'role'
//             }
//         }
//     },
//     account: {
//         modelName: 'accounts',
//     },
//     session: {
//         modelName: 'session'
//     },
//     onAPIError: {
//         onError: (error: any, ctx) => {
//             console.error(error);
//             console.error(error?.body);
//             console.error(error?.cause);
//         }
//     }
// })