import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // Get IP from x-forwarded-for header
    const forwardedFor = request.headers.get('x-forwarded-for')

    // If x-forwarded-for is not available, try to get from other headers
    const realIp = request.headers.get('x-real-ip')

    // Use the first IP from x-forwarded-for, or x-real-ip, or default to unknown
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

    return new NextResponse(ip)
}