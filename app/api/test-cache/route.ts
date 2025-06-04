import { NextRequest, NextResponse } from 'next/server'
import { testCacheOperations, debugCacheState, clearTestCache, testSportsInvalidation } from '@/lib/cache/test'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'

    try {
        switch (action) {
            case 'test':
                await testCacheOperations()
                return NextResponse.json({
                    success: true,
                    message: 'Cache test completed. Check server logs for results.'
                })

            case 'debug':
                await debugCacheState()
                return NextResponse.json({
                    success: true,
                    message: 'Cache debug completed. Check server logs for current state.'
                })

            case 'clear':
                await clearTestCache()
                return NextResponse.json({
                    success: true,
                    message: 'Test cache cleared successfully.'
                })

            case 'sports':
                await testSportsInvalidation()
                return NextResponse.json({
                    success: true,
                    message: 'Sports invalidation test completed. Check server logs for results.'
                })

            default:
                return NextResponse.json({
                    error: 'Invalid action. Use ?action=test, ?action=debug, ?action=clear, or ?action=sports'
                })
        }
    } catch (error) {
        console.error('Cache test error:', error)
        return NextResponse.json({
            error: 'Cache test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        })
    }
} 