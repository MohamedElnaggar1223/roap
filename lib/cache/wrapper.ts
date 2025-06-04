import { getCachedData, setCachedData } from './redis'
import { CACHE_TTL } from './keys'

// Generic cache wrapper for database functions
export async function withCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.STATIC_DATA
): Promise<T> {
    // Try to get from cache first
    const cached = await getCachedData<T>(cacheKey)

    if (cached !== null) {
        return cached
    }

    // If not in cache, fetch from database
    const data = await fetcher()

    // Store in cache for next time (don't await to not slow down response)
    setCachedData(cacheKey, data, ttl).catch(error => {
        console.error('Error setting cache for key:', cacheKey, error)
    })

    return data
}

// Specialized wrapper for paginated data
export async function withPaginatedCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.PAGINATED_DATA
): Promise<T> {
    return withCache(cacheKey, fetcher, ttl)
}

// Wrapper for academy-specific data
export async function withAcademyCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.ACADEMY_DATA
): Promise<T> {
    return withCache(cacheKey, fetcher, ttl)
}

// Wrapper for dynamic data (programs, coaches, etc.)
export async function withDynamicCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.DYNAMIC_DATA
): Promise<T> {
    return withCache(cacheKey, fetcher, ttl)
}

// Helper function to skip cache in development if needed
export async function withCacheConditional<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.STATIC_DATA,
    skipCache: boolean = false
): Promise<T> {
    if (skipCache || process.env.NODE_ENV === 'development') {
        return fetcher()
    }

    return withCache(cacheKey, fetcher, ttl)
} 