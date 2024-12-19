'use server'

import { auth } from "@/auth"
import { db } from "@/db"
import { academics } from "@/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from 'next/headers'

export async function startImpersonation(academyId: number) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    // Verify academy exists
    const academy = await db.query.academics.findFirst({
        where: eq(academics.userId, academyId)
    })

    if (!academy) {
        return { error: 'Academy not found' }
    }

    // Store impersonation state in an HTTP-only cookie
    const cookiesData = await cookies()
    await cookiesData.set('impersonatedAcademyId', academyId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    return { success: true }
}

export async function stopImpersonation() {
    const cookiesData = await cookies()
    await cookiesData.delete('impersonatedAcademyId')
    return { success: true }
}

// Helper to get current academy ID (real or impersonated)
export async function getCurrentAcademyId() {
    const session = await auth()
    if (!session?.user) return null

    const cookiesData = await cookies()
    const impersonatedId = cookiesData.get('impersonatedAcademyId')?.value

    if (session.user.role === 'admin' && impersonatedId) {
        return parseInt(impersonatedId)
    }

    if (session.user.role === 'academic') {
        const academy = await db.query.academics.findFirst({
            where: eq(academics.userId, parseInt(session.user.id)),
            columns: { id: true }
        })
        return academy?.id || null
    }

    return null
}