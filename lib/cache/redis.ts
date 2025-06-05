import { Redis } from '@upstash/redis'
import { CACHE_KEYS } from './keys'

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
            return null
        }

        // Upstash Redis automatically deserializes JSON, so we can return directly
        return data as T
    } catch (error) {
        console.error('Error getting cached data for key:', key, error)
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

// Update cache with fresh data (better than deletion)
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

export async function deleteCachedPattern(pattern: string): Promise<void> {
    try {
        const client = getRedisClient()
        console.log(`🗑️ Deleting cache pattern: ${pattern}`)

        // Upstash doesn't support SCAN/KEYS, so we need to delete specific known keys
        // Instead of using patterns, we'll delete all the known cache keys for that pattern
        const keysToDelete: string[] = []

        if (pattern === 'sports:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_SPORTS,
                // Add pattern for paginated sports - we'll delete a reasonable range
                ...generatePaginatedKeys('paginated:sports:', 1, 10), // Covers most common pagination
                // Add pattern for translations
                ...generateTranslationKeys('translations:sports:')
            )
        } else if (pattern === 'facilities:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_FACILITIES,
                ...generatePaginatedKeys('paginated:facilities:', 1, 10),
                ...generateTranslationKeys('translations:facilities:')
            )
        } else if (pattern === 'countries:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_COUNTRIES,
                ...generatePaginatedKeys('paginated:countries:', 1, 10),
                ...generateTranslationKeys('translations:countries:')
            )
        } else if (pattern === 'states:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_STATES,
                ...generatePaginatedKeys('paginated:states:', 1, 10),
                ...generateTranslationKeys('translations:states:')
            )
        } else if (pattern === 'cities:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_CITIES,
                ...generatePaginatedKeys('paginated:cities:', 1, 10),
                ...generateTranslationKeys('translations:cities:')
            )
        } else if (pattern === 'genders:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_GENDERS,
                ...generatePaginatedKeys('paginated:genders:', 1, 10),
                ...generateTranslationKeys('translations:genders:')
            )
        } else if (pattern === 'spoken_languages:*') {
            keysToDelete.push(
                CACHE_KEYS.ALL_SPOKEN_LANGUAGES,
                ...generateTranslationKeys('translations:spoken_languages:')
            )
        } else if (pattern === 'paginated:sports:*') {
            keysToDelete.push(...generatePaginatedKeys('paginated:sports:', 1, 50))
        } else if (pattern === 'paginated:facilities:*') {
            keysToDelete.push(...generatePaginatedKeys('paginated:facilities:', 1, 50))
        } else if (pattern === 'paginated:countries:*') {
            keysToDelete.push(...generatePaginatedKeys('paginated:countries:', 1, 50))
        } else if (pattern === 'paginated:states:*') {
            keysToDelete.push(...generatePaginatedKeys('paginated:states:', 1, 50))
        } else if (pattern === 'paginated:cities:*') {
            keysToDelete.push(...generatePaginatedKeys('paginated:cities:', 1, 50))
        } else if (pattern === 'paginated:genders:*') {
            keysToDelete.push(...generatePaginatedKeys('paginated:genders:', 1, 50))
        } else if (pattern === 'translations:sports:*') {
            keysToDelete.push(...generateTranslationKeys('translations:sports:'))
        } else if (pattern === 'translations:facilities:*') {
            keysToDelete.push(...generateTranslationKeys('translations:facilities:'))
        } else if (pattern === 'translations:countries:*') {
            keysToDelete.push(...generateTranslationKeys('translations:countries:'))
        } else if (pattern === 'translations:states:*') {
            keysToDelete.push(...generateTranslationKeys('translations:states:'))
        } else if (pattern === 'translations:cities:*') {
            keysToDelete.push(...generateTranslationKeys('translations:cities:'))
        } else if (pattern === 'translations:genders:*') {
            keysToDelete.push(...generateTranslationKeys('translations:genders:'))
        } else if (pattern === 'translations:spoken_languages:*') {
            keysToDelete.push(...generateTranslationKeys('translations:spoken_languages:'))
        } else if (pattern.startsWith('academy:') && pattern.endsWith(':*')) {
            // Handle academy patterns like 'academy:123:*'
            const academyId = pattern.match(/academy:(\d+):\*/)?.[1]
            if (academyId) {
                keysToDelete.push(
                    CACHE_KEYS.ACADEMY_DETAILS(parseInt(academyId)),
                    CACHE_KEYS.ACADEMY_SPORTS(parseInt(academyId)),
                    CACHE_KEYS.ACADEMY_FACILITIES(parseInt(academyId)),
                    CACHE_KEYS.ACADEMY_PROGRAMS(parseInt(academyId)),
                    CACHE_KEYS.ACADEMY_COACHES(parseInt(academyId)),
                    CACHE_KEYS.ACADEMY_LOCATIONS(parseInt(academyId))
                )
            }
        } else if (pattern.startsWith('program:') && pattern.endsWith(':*')) {
            // Handle program patterns like 'program:123:*'
            const programId = pattern.match(/program:(\d+):\*/)?.[1]
            if (programId) {
                keysToDelete.push(
                    CACHE_KEYS.PROGRAM_DETAILS(parseInt(programId)),
                    CACHE_KEYS.PROGRAM_PACKAGES(parseInt(programId)),
                    CACHE_KEYS.PROGRAM_DISCOUNTS(parseInt(programId))
                )
            }
        } else {
            // For unknown patterns, try to delete the pattern as-is (won't work but won't crash)
            console.warn(`Unknown cache pattern: ${pattern}. Cannot delete pattern with Upstash.`)
            return
        }

        // Delete all keys in batches to avoid overwhelming the server
        if (keysToDelete.length > 0) {
            const batches = chunkArray(keysToDelete, 100) // Process in batches of 100
            let totalDeleted = 0

            for (const batch of batches) {
                const deletePromises = batch.map(async key => {
                    const result = await client.del(key)
                    return result
                })
                const results = await Promise.all(deletePromises)
                totalDeleted += results.reduce((sum, result) => sum + result, 0)
            }
            console.log(`🗑️ Deleted ${totalDeleted} cache keys for pattern: ${pattern}`)
        }
    } catch (error) {
        console.error('Error deleting cached pattern:', error)
    }
}

// Helper function to generate common pagination keys
function generatePaginatedKeys(prefix: string, maxPages: number, maxPageSizes: number): string[] {
    const keys: string[] = []
    const pageSizes = [10, 20, 50, 100] // Common page sizes
    const orderBys = ['asc', 'desc'] // Common order by values

    for (let page = 1; page <= maxPages; page++) {
        for (const pageSize of pageSizes) {
            if (pageSize <= maxPageSizes * 10) { // Reasonable limit
                for (const orderBy of orderBys) {
                    keys.push(`${prefix}${page}:${pageSize}:${orderBy}`)
                    keys.push(`${prefix}${page}:${pageSize}:${orderBy}(*)`) // Some order bys might have function syntax
                }
            }
        }
    }
    return keys
}

// Helper function to generate translation keys
function generateTranslationKeys(prefix: string): string[] {
    const locales = ['en', 'ar', 'fr', 'es', 'de', 'zh', 'ja'] // Common locales
    return locales.map(locale => `${prefix}${locale}`)
}

// Helper function to chunk arrays
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
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
        const result = await client.ping()
        return result === 'PONG'
    } catch (error) {
        console.error('Redis health check failed:', error)
        return false
    }
} 