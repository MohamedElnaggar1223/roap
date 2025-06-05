import { redis } from './redis';

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Retrieves and parses data from Redis.
 * @param key The cache key.
 * @returns The cached data or null if not found or error.
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get<T>(key);
        if (data) {
            // console.log(`CACHE HIT: ${key}`);
            return data;
        }
        // console.log(`CACHE MISS: ${key}`);
        return null;
    } catch (error) {
        console.error(`Error getting from cache for key "${key}":`, error);
        return null;
    }
}

/**
 * Stringifies and stores data in Redis, with an optional TTL.
 * @param key The cache key.
 * @param data The data to cache.
 * @param ttlInSeconds Optional TTL in seconds. Defaults to DEFAULT_TTL_SECONDS.
 */
export async function setToCache<T>(key: string, data: T, ttlInSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
        if (data === undefined || data === null) {
            // console.warn(`Attempted to cache undefined/null data for key "${key}". Clearing cache instead.`);
            await clearCache(key);
            return;
        }
        await redis.set(key, data, { ex: ttlInSeconds });
        // console.log(`CACHE SET: ${key}`);
    } catch (error) {
        console.error(`Error setting to cache for key "${key}":`, error);
    }
}

/**
 * Fetches fresh data using fetchDataFn and updates the cache.
 * If fetchDataFn fails or returns no data, the cache for the key is cleared.
 * This is central to the "update-on-write" invalidation strategy.
 * @param key The cache key to update.
 * @param fetchDataFn A function that fetches the fresh data.
 * @param ttlInSeconds Optional TTL in seconds for the new cache entry.
 */
export async function updateCachedItem<T>(
    key: string,
    fetchDataFn: () => Promise<T | { data: T; error?: any; field?: any } | null>,
    ttlInSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
    // console.log(`CACHE UPDATE ATTEMPT: ${key}`);
    try {
        const freshDataResult = await fetchDataFn();
        let dataToCache: T | null = null;

        if (freshDataResult && typeof freshDataResult === 'object' && 'data' in freshDataResult) {
            // Handle cases where fetchDataFn returns an object like { data: ..., error: ... }
            if (freshDataResult.error) {
                console.error(`Error fetching fresh data for key "${key}" during cache update:`, freshDataResult.error);
            } else {
                dataToCache = freshDataResult.data;
            }
        } else if (freshDataResult !== null && freshDataResult !== undefined) {
            // Handle cases where fetchDataFn returns the data directly or null
            dataToCache = freshDataResult as T;
        }

        if (dataToCache !== null && dataToCache !== undefined) {
            await setToCache(key, dataToCache, ttlInSeconds);
            // console.log(`CACHE UPDATED (new data): ${key}`);
        } else {
            // console.log(`CACHE CLEARED (no fresh data or error): ${key}`);
            await clearCache(key);
        }
    } catch (error) {
        console.error(`Error updating cached item for key "${key}":`, error);
        // In case of an error during the fetch or set operation, clear the cache to avoid stale data.
        await clearCache(key);
    }
}

/**
 * Clears one or more cache keys from Redis.
 * @param key A single cache key or an array of cache keys.
 */
export async function clearCache(key: string | string[]): Promise<void> {
    try {
        const keysToClear = Array.isArray(key) ? key : [key];
        if (keysToClear.length > 0) {
            await redis.del(...keysToClear);
            // console.log(`CACHE CLEARED: ${keysToClear.join(', ')}`);
        }
    } catch (error) {
        const keysString = Array.isArray(key) ? key.join(', ') : key;
        console.error(`Error clearing cache for key(s) "${keysString}":`, error);
    }
}

/**
 * A utility to generate consistent cache keys.
 * @param parts The parts of the key. Filters out null/undefined parts.
 * @returns A colon-separated cache key string.
 */
export function generateCacheKey(...parts: (string | number | null | undefined)[]): string {
    return parts.filter(part => part !== null && part !== undefined).join(':');
} 