import { getCachedData, setCachedData, deleteCachedPattern, isRedisHealthy, updateCachedData } from './redis'
import { CACHE_KEYS, CACHE_PATTERNS } from './keys'
import { invalidateAllSportRelatedData, invalidateAllSportRelatedDataSimple } from './invalidation'

// Comprehensive test to debug cache update issues
export async function debugCacheUpdates() {
    console.log('=== Debugging Cache Update Issues ===')

    try {
        // 1. Test Redis connectivity
        console.log('\n1. Testing Redis connectivity...')
        const isHealthy = await isRedisHealthy()
        console.log(`Redis health check: ${isHealthy ? '✅ PASS' : '❌ FAIL'}`)

        if (!isHealthy) {
            console.error('Redis is not healthy. Stopping tests.')
            return
        }

        // 2. Test basic set/get with logging
        console.log('\n2. Testing basic set/get operations...')
        const testKey = 'debug:test:basic'
        const originalData = {
            test: true,
            timestamp: Date.now(),
            message: 'Original data'
        }

        console.log('Setting original data:', originalData)
        await setCachedData(testKey, originalData, 60)

        console.log('Getting data back...')
        const retrievedData = await getCachedData(testKey)
        console.log('Retrieved data:', retrievedData)

        const isBasicWorking = JSON.stringify(originalData) === JSON.stringify(retrievedData)
        console.log(`Basic operations: ${isBasicWorking ? '✅ PASS' : '❌ FAIL'}`)

        if (!isBasicWorking) {
            console.error('Basic operations failed. Cannot proceed with update tests.')
            return
        }

        // 3. Test cache update function
        console.log('\n3. Testing updateCachedData function...')

        const updatedData = {
            test: true,
            timestamp: Date.now(),
            message: 'Updated data via updateCachedData'
        }

        console.log('Original cached data:', await getCachedData(testKey))

        const updateResult = await updateCachedData(
            testKey,
            async () => {
                console.log('Fetcher function called, returning:', updatedData)
                return updatedData
            },
            60
        )

        console.log('Update function returned:', updateResult)
        console.log('Data after update:', await getCachedData(testKey))

        const isUpdateWorking = JSON.stringify(updatedData) === JSON.stringify(await getCachedData(testKey))
        console.log(`Update function: ${isUpdateWorking ? '✅ PASS' : '❌ FAIL'}`)

        // 4. Test with sports cache specifically
        console.log('\n4. Testing sports cache update...')

        const sportsKey = CACHE_KEYS.ALL_SPORTS
        const originalSports = [
            { id: 1, name: 'Football', slug: 'football' },
            { id: 2, name: 'Basketball', slug: 'basketball' }
        ]

        const updatedSports = [
            { id: 1, name: 'Football Updated', slug: 'football' },
            { id: 2, name: 'Basketball Updated', slug: 'basketball' },
            { id: 3, name: 'Tennis', slug: 'tennis' }
        ]

        // Set original sports data
        console.log('Setting original sports data...')
        await setCachedData(sportsKey, originalSports, 3600)
        console.log('Original sports cached:', await getCachedData(sportsKey))

        // Update sports data
        console.log('Updating sports cache...')
        const sportsUpdateResult = await updateCachedData(
            sportsKey,
            async () => {
                console.log('Sports fetcher called, returning updated data')
                return updatedSports
            },
            3600
        )

        console.log('Sports update result:', sportsUpdateResult)
        const finalSportsData = await getCachedData(sportsKey)
        console.log('Final sports data in cache:', finalSportsData)

        const isSportsUpdateWorking = JSON.stringify(updatedSports) === JSON.stringify(finalSportsData)
        console.log(`Sports update: ${isSportsUpdateWorking ? '✅ PASS' : '❌ FAIL'}`)

        // 5. Test the actual invalidation function
        console.log('\n5. Testing actual invalidation function...')

        // Set up test data
        await setCachedData(sportsKey, originalSports, 3600)
        console.log('Set original sports for invalidation test:', await getCachedData(sportsKey))

        // Run invalidation (which should update with fresh DB data)
        console.log('Running invalidateAllSportRelatedData...')
        await invalidateAllSportRelatedData()

        const dataAfterInvalidation = await getCachedData(sportsKey)
        console.log('Data after invalidation:', dataAfterInvalidation)

        if (dataAfterInvalidation === null) {
            console.log('✅ Invalidation deleted the cache (fallback approach worked)')
        } else if (JSON.stringify(dataAfterInvalidation) !== JSON.stringify(originalSports)) {
            console.log('✅ Invalidation updated the cache with fresh data')
        } else {
            console.log('❌ Invalidation did not change the cache')
        }

        // Clean up
        await deleteCachedPattern(testKey)
        await deleteCachedPattern(sportsKey)

        console.log('\n=== Debug Summary ===')
        console.log(`Basic operations: ${isBasicWorking ? '✅' : '❌'}`)
        console.log(`Update function: ${isUpdateWorking ? '✅' : '❌'}`)
        console.log(`Sports update: ${isSportsUpdateWorking ? '✅' : '❌'}`)

    } catch (error) {
        console.error('Error during cache debugging:', error)
    }
}

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

        // 5. Test smart sports invalidation (new approach)
        console.log('\n5. Testing smart sports invalidation...')

        // Set up some test cache data first
        await setCachedData(sportsKey, mockSportsData, 3600)
        await setCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'), mockSportsData, 1800)

        console.log('Before smart invalidation:')
        console.log('- All sports:', await getCachedData(sportsKey))
        console.log('- Paginated sports:', await getCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc')))

        // Run smart invalidation
        await invalidateAllSportRelatedData()

        console.log('After smart invalidation:')
        const sportsAfterSmart = await getCachedData(sportsKey)
        const paginatedAfterSmart = await getCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'))
        console.log('- All sports:', sportsAfterSmart)
        console.log('- Paginated sports:', paginatedAfterSmart)

        // 6. Test simple sports invalidation (fallback approach)
        console.log('\n6. Testing simple sports invalidation...')

        // Set up test data again
        await setCachedData(sportsKey, mockSportsData, 3600)
        await setCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'), mockSportsData, 1800)

        console.log('Before simple invalidation:')
        console.log('- All sports:', await getCachedData(sportsKey))
        console.log('- Paginated sports:', await getCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc')))

        // Run simple invalidation
        await invalidateAllSportRelatedDataSimple()

        console.log('After simple invalidation:')
        const sportsAfterSimple = await getCachedData(sportsKey)
        const paginatedAfterSimple = await getCachedData(CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'))
        console.log('- All sports:', sportsAfterSimple)
        console.log('- Paginated sports:', paginatedAfterSimple)

        console.log('\n=== Test Results Summary ===')
        console.log(`Pattern deletion: ${sportsAfterDeletion === null ? 'PASS' : 'FAIL'}`)
        console.log(`Smart invalidation - Sports: ${sportsAfterSmart !== null ? 'UPDATED' : 'DELETED'}`)
        console.log(`Smart invalidation - Paginated: ${paginatedAfterSmart === null ? 'DELETED' : 'NOT DELETED'}`)
        console.log(`Simple invalidation - Sports: ${sportsAfterSimple === null ? 'DELETED' : 'NOT DELETED'}`)
        console.log(`Simple invalidation - Paginated: ${paginatedAfterSimple === null ? 'DELETED' : 'NOT DELETED'}`)

        if (sportsAfterSmart !== null) {
            console.log('✅ Smart invalidation is working - cache refreshed with new data')
        } else if (sportsAfterSimple === null && paginatedAfterSimple === null) {
            console.log('✅ Simple invalidation is working - cache properly deleted')
        } else {
            console.log('❌ Both invalidation approaches have issues')
        }

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
        CACHE_KEYS.SPORT_TRANSLATIONS('en'),
        'academy:123:sports', // Example academy cache
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
        'debug:test:basic',
        CACHE_KEYS.ALL_SPORTS,
        CACHE_KEYS.PAGINATED_SPORTS(1, 10, 'asc'),
        CACHE_KEYS.PAGINATED_SPORTS(1, 20, 'desc'),
        CACHE_KEYS.SPORT_TRANSLATIONS('en'),
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

// Quick test for sports invalidation specifically
export async function testSportsInvalidation() {
    console.log('=== Testing Sports Invalidation Only ===')

    try {
        const sportsKey = CACHE_KEYS.ALL_SPORTS
        const mockData = [{ id: 999, name: 'Test Sport', slug: 'test-sport' }]

        // Set mock data
        await setCachedData(sportsKey, mockData, 3600)
        console.log('Set mock sports data:', mockData)

        // Verify it's cached
        const cached = await getCachedData(sportsKey)
        console.log('Retrieved from cache:', cached)

        // Test invalidation
        console.log('\nRunning sports invalidation...')
        await invalidateAllSportRelatedData()

        // Check result
        const afterInvalidation = await getCachedData(sportsKey)
        console.log('After invalidation:', afterInvalidation)

        if (afterInvalidation === null) {
            console.log('✅ SUCCESS: Cache was properly deleted')
        } else if (JSON.stringify(afterInvalidation) !== JSON.stringify(mockData)) {
            console.log('✅ SUCCESS: Cache was refreshed with new data')
        } else {
            console.log('❌ FAILED: Cache still contains old data')
        }

    } catch (error) {
        console.error('Error in sports invalidation test:', error)
    }
} 