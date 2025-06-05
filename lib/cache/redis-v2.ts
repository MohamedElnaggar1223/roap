import { Redis } from '@upstash/redis'

// Redis client instance
let redis: Redis | null = null

// Get or create Redis client
export function getRedisClient(): Redis {
    if (!redis) {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('Upstash Redis environment variables are not set')
        }

        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
    }

    return redis
}

// Improved cache operations that handle Upstash Redis properly
export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const client = getRedisClient()
        const data = await client.get(key)

        if (data === null || data === undefined) {
            console.log(`🔍 Cache MISS: ${key}`)
            return null
        }

        console.log(`🎯 Cache HIT: ${key}`)
        // Upstash Redis automatically deserializes JSON, so we can return directly
        return data as T
    } catch (error) {
        console.error('❌ Error getting cached data for key:', key, error)
        return null
    }
}

export async function setCachedData<T>(
    key: string,
    data: T,
    ttl: number = 3600
): Promise<boolean> {
    try {
        const client = getRedisClient()

        // Upstash Redis automatically handles JSON serialization
        const result = await client.setex(key, ttl, data)

        if (result === 'OK') {
            console.log(`✅ Cache SET successful: ${key} (TTL: ${ttl}s)`)
            return true
        } else {
            console.error(`❌ Cache SET failed: ${key}, result:`, result)
            return false
        }
    } catch (error) {
        console.error('❌ Error setting cached data for key:', key, error)
        return false
    }
}

// Improved update function with verification
export async function updateCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
): Promise<T> {
    console.log(`🔄 Updating cache for key: ${key}`)

    try {
        // Fetch fresh data
        const freshData = await fetcher()
        console.log(`📥 Fetched fresh data for ${key}`)

        // Set the fresh data in cache
        const setSuccess = await setCachedData(key, freshData, ttl)

        if (!setSuccess) {
            console.warn(`⚠️ Failed to set cache for ${key}`)
        } else {
            // Verify the data was stored correctly
            const verification = await getCachedData<T>(key)
            if (verification !== null) {
                console.log(`✅ Cache update verified for ${key}`)
            } else {
                console.warn(`⚠️ Cache verification failed for ${key}`)
            }
        }

        return freshData
    } catch (error) {
        console.error('❌ Error updating cached data for key:', key, error)

        // If update fails, delete stale data
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
): Promise<{ successful: number; failed: number }> {
    console.log(`🔄 Batch updating ${updates.length} cache keys...`)

    let successful = 0
    let failed = 0

    try {
        const updatePromises = updates.map(async ({ key, fetcher, ttl = 3600 }) => {
            try {
                await updateCachedData(key, fetcher, ttl)
                successful++
                return { key, success: true }
            } catch (error) {
                console.error(`❌ Error updating cache for key ${key}:`, error)
                failed++
                return { key, success: false, error }
            }
        })

        await Promise.allSettled(updatePromises)
        console.log(`✅ Batch update completed: ${successful} successful, ${failed} failed`)

        return { successful, failed }
    } catch (error) {
        console.error('❌ Error in batch cache update:', error)
        return { successful, failed: updates.length }
    }
}

export async function deleteCachedData(key: string): Promise<boolean> {
    try {
        const client = getRedisClient()
        const result = await client.del(key)
        console.log(`🗑️ Cache DELETE: ${key} (deleted: ${result})`)
        return result > 0
    } catch (error) {
        console.error('❌ Error deleting cached data for key:', key, error)
        return false
    }
}

// Health check
export async function isRedisHealthy(): Promise<boolean> {
    try {
        const client = getRedisClient()
        const result = await client.ping()
        return result === 'PONG'
    } catch (error) {
        console.error('❌ Redis health check failed:', error)
        return false
    }
}

// Test function to verify cache operations work
export async function verifyCacheOperations(): Promise<boolean> {
    const testKey = 'test:verify:operations'
    const testData = { test: true, timestamp: Date.now() }

    try {
        // Test set
        console.log('Testing cache set...')
        const setResult = await setCachedData(testKey, testData, 60)
        if (!setResult) {
            console.error('❌ Cache set failed')
            return false
        }

        // Test get
        console.log('Testing cache get...')
        const getData = await getCachedData(testKey)
        if (!getData) {
            console.error('❌ Cache get failed')
            return false
        }

        // Test data integrity
        const dataMatches = JSON.stringify(testData) === JSON.stringify(getData)
        if (!dataMatches) {
            console.error('❌ Cache data integrity failed')
            console.log('Original:', testData)
            console.log('Retrieved:', getData)
            return false
        }

        // Test update
        console.log('Testing cache update...')
        const updatedData = { test: true, timestamp: Date.now() + 1000, updated: true }
        const updateResult = await updateCachedData(testKey, async () => updatedData, 60)

        const finalData = await getCachedData(testKey)
        const updateMatches = JSON.stringify(updatedData) === JSON.stringify(finalData)

        if (!updateMatches) {
            console.error('❌ Cache update failed')
            console.log('Expected:', updatedData)
            console.log('Retrieved:', finalData)
            return false
        }

        // Clean up
        await deleteCachedData(testKey)

        console.log('✅ All cache operations verified successfully')
        return true

    } catch (error) {
        console.error('❌ Error during cache verification:', error)
        await deleteCachedData(testKey) // Clean up
        return false
    }
} 