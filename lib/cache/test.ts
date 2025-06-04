import { getCachedData, setCachedData, deleteCachedPattern, isRedisHealthy } from './redis'
import { CACHE_KEYS, CACHE_PATTERNS } from './keys'
import { invalidateAllSportRelatedData } from './invalidation'

export async function testCacheOperations() {
    console.log('=== Testing Redis Cache Operations ===')

    try {
        // 1. Test Redis connectivity
        console.log('1. Testing Redis connectivity...')
        const isHealthy = await isRedisHealthy()
        console.log(`Redis health check: ${isHealthy ? 'PASS' : 'FAIL'}`)

        if (!isHealthy) {
            console.error('Redis is not healthy. Stopping tests.')
            return
        }

        // 2. Test basic set/get operations
        console.log('\n2. Testing basic cache operations...')
        const testKey = 'test:cache:operation'
        const testData = { test: true, timestamp: Date.now() }

        await setCachedData(testKey, testData, 60) // 1 minute TTL
        const retrievedData = await getCachedData(testKey)

        console.log('Set data:', testData)
        console.log('Retrieved data:', retrievedData)
        console.log(`Basic operations: ${JSON.stringify(testData) === JSON.stringify(retrievedData) ? 'PASS' : 'FAIL'}`)

        // 3. Test sports cache before invalidation
        console.log('\n3. Testing sports cache before invalidation...')
        const sportsKey = CACHE_KEYS.ALL_SPORTS
        const mockSportsData = [
            { id: 1, name: 'Football', slug: 'football' },
            { id: 2, name: 'Basketball', slug: 'basketball' }
        ]

        await setCachedData(sportsKey, mockSportsData, 3600)
        const cachedSports = await getCachedData(sportsKey)
        console.log('Cached sports before invalidation:', cachedSports)

        // 4. Test pattern deletion (the main issue)
        console.log('\n4. Testing pattern deletion...')
        await deleteCachedPattern(CACHE_PATTERNS.ALL_SPORTS)

        const sportsAfterDeletion = await getCachedData(sportsKey)
        console.log('Cached sports after pattern deletion:', sportsAfterDeletion)
        console.log(`Pattern deletion: ${sportsAfterDeletion === null ? 'PASS' : 'FAIL'}`)

        // 5. Test full sports invalidation
        console.log('\n5. Testing full sports invalidation...')

        // Set up some test cache data first
        await setCachedData(sportsKey, mockSportsData, 3600)
        await setCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'), mockSportsData, 1800)

        console.log('Before invalidation:')
        console.log('- All sports:', await getCachedData(sportsKey))
        console.log('- Paginated sports:', await getCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc')))

        // Run invalidation
        await invalidateAllSportRelatedData()

        console.log('After invalidation:')
        console.log('- All sports:', await getCachedData(sportsKey))
        console.log('- Paginated sports:', await getCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc')))

        console.log('\n=== Test Results ===')
        console.log('If sports cache is null after invalidation, the fix is working!')
        console.log('If sports cache still contains old data, there\'s still an issue.')

    } catch (error) {
        console.error('Error during cache testing:', error)
    }
}

// Function to debug current cache state
export async function debugCacheState() {
    console.log('=== Current Cache State ===')

    const keysToCheck = [
        CACHE_KEYS.ALL_SPORTS,
        CACHE_KEYS.ALL_FACILITIES,
        CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'),
        CACHE_KEYS.PAGINATED_SPORTS(1, 20, 'desc'),
    ]

    for (const key of keysToCheck) {
        try {
            const data = await getCachedData(key)
            console.log(`${key}:`, data ? `${JSON.stringify(data).substring(0, 100)}...` : 'null')
        } catch (error) {
            console.error(`Error checking ${key}:`, error)
        }
    }
}

// Function to clear all test data
export async function clearTestCache() {
    console.log('Clearing test cache data...')

    const testKeys = [
        'test:cache:operation',
        CACHE_KEYS.ALL_SPORTS,
        CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'),
        CACHE_KEYS.PAGINATED_SPORTS(1, 20, 'desc'),
    ]

    for (const key of testKeys) {
        try {
            await deleteCachedPattern(key)
            console.log(`Cleared: ${key}`)
        } catch (error) {
            console.error(`Error clearing ${key}:`, error)
        }
    }
} 