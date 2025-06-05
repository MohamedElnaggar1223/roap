import { Redis } from '@upstash/redis'

// Simple test to debug Redis operations
export async function simpleRedisTest() {
    console.log('=== Simple Redis Test ===')

    try {
        // Check environment variables
        console.log('1. Checking environment variables...')
        const url = process.env.UPSTASH_REDIS_REST_URL
        const token = process.env.UPSTASH_REDIS_REST_TOKEN

        console.log('Redis URL:', url ? 'Set' : 'Missing')
        console.log('Redis Token:', token ? 'Set' : 'Missing')

        if (!url || !token) {
            console.error('❌ Redis environment variables missing')
            return
        }

        // Create Redis client
        console.log('\n2. Creating Redis client...')
        const redis = new Redis({
            url: url,
            token: token,
        })

        // Test ping
        console.log('\n3. Testing ping...')
        const pingResult = await redis.ping()
        console.log('Ping result:', pingResult)

        // Test basic set/get
        console.log('\n4. Testing basic set/get...')
        const testKey = 'simple:test:key'
        const testData = { message: 'Hello Redis', timestamp: Date.now() }

        console.log('Setting data:', testData)
        await redis.setex(testKey, 60, testData)

        console.log('Getting data...')
        const retrieved = await redis.get(testKey)
        console.log('Retrieved data:', retrieved)
        console.log('Type of retrieved data:', typeof retrieved)

        // Test if they match
        const match = JSON.stringify(testData) === JSON.stringify(retrieved)
        console.log('Data matches:', match)

        // Test manual JSON stringify/parse
        console.log('\n5. Testing manual JSON handling...')
        const manualKey = 'simple:test:manual'
        const manualData = { message: 'Manual JSON', timestamp: Date.now() }

        console.log('Setting with JSON.stringify:', manualData)
        await redis.setex(manualKey, 60, JSON.stringify(manualData))

        console.log('Getting raw...')
        const manualRetrieved = await redis.get(manualKey)
        console.log('Retrieved raw:', manualRetrieved)
        console.log('Type:', typeof manualRetrieved)

        if (typeof manualRetrieved === 'string') {
            const parsed = JSON.parse(manualRetrieved)
            console.log('Parsed:', parsed)
            console.log('Manual matches:', JSON.stringify(manualData) === JSON.stringify(parsed))
        }

        // Test updating the same key
        console.log('\n6. Testing key update...')
        const originalValue = { step: 1, message: 'Original' }
        const updatedValue = { step: 2, message: 'Updated' }

        console.log('Setting original:', originalValue)
        await redis.setex(testKey, 60, originalValue)

        console.log('Reading original:', await redis.get(testKey))

        console.log('Setting updated:', updatedValue)
        await redis.setex(testKey, 60, updatedValue)

        const finalValue = await redis.get(testKey)
        console.log('Reading final:', finalValue)

        const updateWorked = JSON.stringify(updatedValue) === JSON.stringify(finalValue)
        console.log('Update worked:', updateWorked)

        // Clean up
        console.log('\n7. Cleaning up...')
        await redis.del(testKey)
        await redis.del(manualKey)

        console.log('✅ Simple Redis test completed')

    } catch (error) {
        console.error('❌ Error in simple Redis test:', error)
    }
} 