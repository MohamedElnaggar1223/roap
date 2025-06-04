import { Redis } from '@upstash/redis'

// Redis client instance
let redis: Redis | null = null

// Get or create Redis client
export function getRedisClient(): Redis {
    if (!redis) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
    }

    return redis
}

// Basic cache operations
export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const client = getRedisClient()
        const data = await client.get(key)
        return data as T | null
    } catch (error) {
        console.error('Error getting cached data:', error)
        return null
    }
}

export async function setCachedData<T>(
    key: string,
    data: T,
    ttl: number = 3600
): Promise<void> {
    try {
        const client = getRedisClient()
        await client.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
        console.error('Error setting cached data:', error)
    }
}

// Update cache with fresh data (better than deletion)
export async function updateCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
): Promise<T> {
    try {
        // Fetch fresh data
        const freshData = await fetcher()

        // Update cache with fresh data
        await setCachedData(key, freshData, ttl)

        return freshData
    } catch (error) {
        console.error('Error updating cached data:', error)
        // If update fails, at least delete stale data
        await deleteCachedData(key)
        throw error
    }
}

// Batch update multiple cache keys
export async function updateMultipleCachedData<T>(
    updates: Array<{
        key: string
        fetcher: () => Promise<T>
        ttl?: number
    }>
): Promise<void> {
    try {
        const updatePromises = updates.map(async ({ key, fetcher, ttl = 3600 }) => {
            try {
                const freshData = await fetcher()
                await setCachedData(key, freshData, ttl)
                return { key, success: true }
            } catch (error) {
                console.error(`Error updating cache for key ${key}:`, error)
                await deleteCachedData(key) // Fallback to deletion
                return { key, success: false, error }
            }
        })

        await Promise.allSettled(updatePromises)
    } catch (error) {
        console.error('Error in batch cache update:', error)
    }
}

export async function deleteCachedData(key: string): Promise<void> {
    try {
        const client = getRedisClient()
        await client.del(key)
    } catch (error) {
        console.error('Error deleting cached data:', error)
    }
}

export async function deleteCachedPattern(pattern: string): Promise<void> {
    try {
        const client = getRedisClient()
        // Note: Upstash doesn't support SCAN/KEYS for pattern deletion
        // For now, we'll just delete the exact key if provided
        // In production, you might want to track keys separately
        await client.del(pattern)
    } catch (error) {
        console.error('Error deleting cached pattern:', error)
    }
}

// Invalidate and refresh cache (hybrid approach)
export async function invalidateAndRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
): Promise<void> {
    try {
        // Run both operations in parallel for better performance
        const [freshData] = await Promise.all([
            fetcher(), // Fetch fresh data
            deleteCachedData(key) // Delete stale data
        ])

        // Set fresh data in cache
        await setCachedData(key, freshData, ttl)
    } catch (error) {
        console.error('Error in invalidate and refresh:', error)
        // If fetching fails, at least ensure stale data is removed
        await deleteCachedData(key)
    }
}

// Health check
export async function isRedisHealthy(): Promise<boolean> {
    try {
        const client = getRedisClient()
        await client.ping()
        return true
    } catch (error) {
        console.error('Redis health check failed:', error)
        return false
    }
} 