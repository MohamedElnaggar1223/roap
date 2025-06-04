import { Redis } from '@upstash/redis'
import { CACHE_KEYS } from './keys'

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
            for (const batch of batches) {
                await Promise.all(batch.map(key => client.del(key)))
            }
            console.log(`Deleted ${keysToDelete.length} cache keys for pattern: ${pattern}`)
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
        await client.ping()
        return true
    } catch (error) {
        console.error('Redis health check failed:', error)
        return false
    }
} 