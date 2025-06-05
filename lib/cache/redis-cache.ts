import { Redis } from '@upstash/redis'

// Redis instance
const redis = Redis.fromEnv()

// Cache keys
export const CACHE_KEYS = {
    ACADEMY_DETAILS: (academyId: number) => `academy:${academyId}:details`,
    ACADEMY_SPORTS: (academyId: number) => `academy:${academyId}:sports`,
    ACADEMY_PROGRAMS: (academyId: number) => `academy:${academyId}:programs`,
    ACADEMY_ATHLETES: (academyId: number) => `academy:${academyId}:athletes`,
    ACADEMY_BOOKINGS: (academyId: number) => `academy:${academyId}:bookings`,
    DASHBOARD_STATS: (academyId: number) => `academy:${academyId}:dashboard`,
    PROGRAM_PACKAGES: (programId: number) => `program:${programId}:packages`,
    BRANCH_TRANSLATIONS: (branchId: number) => `branch:${branchId}:translations`,
    SPORT_TRANSLATIONS: (sportId: number) => `sport:${sportId}:translations`,
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
    ACADEMY_DETAILS: 3600, // 1 hour
    ACADEMY_SPORTS: 1800, // 30 minutes
    ACADEMY_PROGRAMS: 900, // 15 minutes
    ACADEMY_ATHLETES: 600, // 10 minutes
    ACADEMY_BOOKINGS: 300, // 5 minutes
    DASHBOARD_STATS: 300, // 5 minutes
    PROGRAM_PACKAGES: 900, // 15 minutes
    TRANSLATIONS: 7200, // 2 hours
} as const

// Generic cache helper functions
export class CacheManager {
    static async get<T>(key: string): Promise<T | null> {
        try {
            const cached = await redis.get(key)
            return cached as T
        } catch (error) {
            console.error('Cache get error:', error)
            return null
        }
    }

    static async set<T>(key: string, value: T, ttl: number): Promise<void> {
        try {
            await redis.set(key, value, { ex: ttl })
        } catch (error) {
            console.error('Cache set error:', error)
        }
    }

    static async del(key: string | string[]): Promise<void> {
        try {
            if (Array.isArray(key)) {
                await redis.del(...key)
            } else {
                await redis.del(key)
            }
        } catch (error) {
            console.error('Cache delete error:', error)
        }
    }

    static async invalidateAcademyCache(academyId: number): Promise<void> {
        const keys = [
            CACHE_KEYS.ACADEMY_DETAILS(academyId),
            CACHE_KEYS.ACADEMY_SPORTS(academyId),
            CACHE_KEYS.ACADEMY_PROGRAMS(academyId),
            CACHE_KEYS.ACADEMY_ATHLETES(academyId),
            CACHE_KEYS.ACADEMY_BOOKINGS(academyId),
            CACHE_KEYS.DASHBOARD_STATS(academyId),
        ]
        await this.del(keys)
    }

    static async invalidateProgramCache(programId: number, academyId: number): Promise<void> {
        const keys = [
            CACHE_KEYS.PROGRAM_PACKAGES(programId),
            CACHE_KEYS.ACADEMY_PROGRAMS(academyId),
            CACHE_KEYS.DASHBOARD_STATS(academyId),
        ]
        await this.del(keys)
    }

    // Cache wrapper for database queries
    static async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key)
        if (cached) {
            return cached
        }

        // If not in cache, fetch from database
        const data = await fetcher()

        // Store in cache for next time
        await this.set(key, data, ttl)

        return data
    }
}

// Specific caching functions for common queries
export class AcademyCache {
    static async getAcademyDetails(academyId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.ACADEMY_DETAILS(academyId),
            fetcher,
            CACHE_TTL.ACADEMY_DETAILS
        )
    }

    static async getAcademySports(academyId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.ACADEMY_SPORTS(academyId),
            fetcher,
            CACHE_TTL.ACADEMY_SPORTS
        )
    }

    static async getAcademyPrograms(academyId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.ACADEMY_PROGRAMS(academyId),
            fetcher,
            CACHE_TTL.ACADEMY_PROGRAMS
        )
    }

    static async getAcademyAthletes(academyId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.ACADEMY_ATHLETES(academyId),
            fetcher,
            CACHE_TTL.ACADEMY_ATHLETES
        )
    }

    static async getDashboardStats(academyId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.DASHBOARD_STATS(academyId),
            fetcher,
            CACHE_TTL.DASHBOARD_STATS
        )
    }
}

// Translation cache for better i18n performance
export class TranslationCache {
    static async getBranchTranslations(branchId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.BRANCH_TRANSLATIONS(branchId),
            fetcher,
            CACHE_TTL.TRANSLATIONS
        )
    }

    static async getSportTranslations(sportId: number, fetcher: () => Promise<any>) {
        return CacheManager.getOrSet(
            CACHE_KEYS.SPORT_TRANSLATIONS(sportId),
            fetcher,
            CACHE_TTL.TRANSLATIONS
        )
    }
} 