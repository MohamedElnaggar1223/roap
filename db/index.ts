import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// PERFORMANCE OPTIMIZED: Connection pool configuration
const poolConfig = {
    max: 20, // Maximum number of connections in pool
    min: 5,  // Minimum number of connections to maintain
    acquireTimeoutMillis: 30000, // Time to wait for connection from pool
    createTimeoutMillis: 30000,  // Time to wait for new connection creation
    destroyTimeoutMillis: 5000,  // Time to wait for connection destruction
    idleTimeoutMillis: 30000,    // Time before idle connections are closed
    reapIntervalMillis: 1000,    // How often to check for idle connections
    createRetryIntervalMillis: 100, // Time between connection creation retries
    propagateCreateError: false, // Don't fail immediately on connection errors

    // Additional postgres-js specific optimizations
    idle_timeout: 20,      // Seconds before closing idle connections
    max_lifetime: 60 * 30, // 30 minutes max connection lifetime
    connect_timeout: 30,   // Connection timeout in seconds

    // Performance tuning
    prepare: false,        // Disable prepared statements for better compatibility
    transform: undefined,  // No data transformation overhead
    debug: process.env.NODE_ENV === 'development', // Debug only in development
}

const client = postgres(process.env.SUPABASE_DATABASE_URL!, poolConfig)

export const db = drizzle({ client, schema }) 