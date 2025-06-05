'use server'

import { db } from '@/db'
import {
    bookings, bookingSessions, packages, programs, branches, sports,
    branchTranslations, sportTranslations, profiles, users, academicAthletic
} from '@/db/schema'
import { eq, and, sql, desc, gte, lte, inArray } from 'drizzle-orm'
import { checkAcademyStatus } from './check-academy-status'
import { cache } from 'react'

// Optimized booking types
export type OptimizedBookingSession = {
    id: number
    date: Date
    startTime: string
    endTime: string
    status: string
    booking: {
        id: number
        price: number
        packageName: string
        programName: string
        branchName: string
        sportName: string
        athleteName: string
        athletePhone: string | null
    }
}

export type OptimizedCalendarEvent = {
    id: number
    title: string
    start: Date
    end: Date
    type: 'booking' | 'block'
    color: string
    meta: {
        packageName: string
        athleteName: string
        branchName: string
        sportName: string
        price?: number
    }
}

// Optimized calendar data fetching with caching
export const getOptimizedCalendarEvents = cache(async (
    startDate: Date,
    endDate: Date
): Promise<{ data: OptimizedCalendarEvent[], error: string | null }> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { data: [], error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        // Single optimized query using our new indexes
        const sessions = await db
            .select({
                sessionId: bookingSessions.id,
                sessionDate: bookingSessions.date,
                sessionFrom: bookingSessions.from,
                sessionTo: bookingSessions.to,
                sessionStatus: bookingSessions.status,
                bookingId: bookings.id,
                bookingPrice: bookings.price,
                packageName: packages.name,
                programName: programs.name,
                programColor: programs.color,
                branchName: branchTranslations.name,
                sportName: sportTranslations.name,
                athleteName: profiles.name,
                athletePhone: users.phoneNumber,
            })
            .from(bookingSessions)
            .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
            .innerJoin(packages, eq(bookings.packageId, packages.id))
            .innerJoin(programs, eq(packages.programId, programs.id))
            .innerJoin(branches, eq(programs.branchId, branches.id))
            .innerJoin(branchTranslations, and(
                eq(branches.id, branchTranslations.branchId),
                eq(branchTranslations.locale, 'en')
            ))
            .innerJoin(sports, eq(programs.sportId, sports.id))
            .innerJoin(sportTranslations, and(
                eq(sports.id, sportTranslations.sportId),
                eq(sportTranslations.locale, 'en')
            ))
            .leftJoin(profiles, eq(bookings.profileId, profiles.id))
            .leftJoin(users, eq(profiles.userId, users.id))
            .where(and(
                eq(programs.academicId, academy.id),
                gte(bookingSessions.date, startDate.toISOString().split('T')[0]),
                lte(bookingSessions.date, endDate.toISOString().split('T')[0])
            ))
            .orderBy(bookingSessions.date, bookingSessions.from)

        // Transform to calendar events
        const calendarEvents: OptimizedCalendarEvent[] = sessions.map(session => {
            const startDateTime = new Date(`${session.sessionDate}T${session.sessionFrom}`)
            const endDateTime = new Date(`${session.sessionDate}T${session.sessionTo}`)

            return {
                id: session.sessionId,
                title: `${session.athleteName} - ${session.packageName}`,
                start: startDateTime,
                end: endDateTime,
                type: 'booking' as const,
                color: session.programColor || '#3B82F6',
                meta: {
                    packageName: session.packageName,
                    athleteName: session.athleteName || 'Unknown',
                    branchName: session.branchName,
                    sportName: session.sportName,
                    price: session.bookingPrice
                }
            }
        })

        return { data: calendarEvents, error: null }

    } catch (error) {
        console.error('Error fetching optimized calendar events:', error)
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
})

// Optimized recent bookings for dashboard
export const getRecentBookings = cache(async (limit: number = 10): Promise<{
    data: OptimizedBookingSession[],
    error: string | null
}> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { data: [], error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        const recentBookings = await db
            .select({
                id: bookingSessions.id,
                date: bookingSessions.date,
                startTime: bookingSessions.from,
                endTime: bookingSessions.to,
                status: bookingSessions.status,
                bookingId: bookings.id,
                price: bookings.price,
                packageName: packages.name,
                programName: programs.name,
                branchName: branchTranslations.name,
                sportName: sportTranslations.name,
                athleteName: profiles.name,
                athletePhone: users.phoneNumber,
            })
            .from(bookingSessions)
            .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
            .innerJoin(packages, eq(bookings.packageId, packages.id))
            .innerJoin(programs, eq(packages.programId, programs.id))
            .innerJoin(branches, eq(programs.branchId, branches.id))
            .innerJoin(branchTranslations, and(
                eq(branches.id, branchTranslations.branchId),
                eq(branchTranslations.locale, 'en')
            ))
            .innerJoin(sports, eq(programs.sportId, sports.id))
            .innerJoin(sportTranslations, and(
                eq(sports.id, sportTranslations.sportId),
                eq(sportTranslations.locale, 'en')
            ))
            .leftJoin(profiles, eq(bookings.profileId, profiles.id))
            .leftJoin(users, eq(profiles.userId, users.id))
            .where(eq(programs.academicId, academy.id))
            .orderBy(desc(bookings.createdAt))
            .limit(limit)

        const optimizedBookings: OptimizedBookingSession[] = recentBookings.map(booking => ({
            id: booking.id,
            date: new Date(booking.date),
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            booking: {
                id: booking.bookingId,
                price: booking.price,
                packageName: booking.packageName,
                programName: booking.programName || '',
                branchName: booking.branchName,
                sportName: booking.sportName,
                athleteName: booking.athleteName || 'Unknown',
                athletePhone: booking.athletePhone
            }
        }))

        return { data: optimizedBookings, error: null }

    } catch (error) {
        console.error('Error fetching recent bookings:', error)
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
})

// Optimized today's sessions
export const getTodaySessions = cache(async (): Promise<{
    data: OptimizedBookingSession[],
    error: string | null
}> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { data: [], error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }
        const today = new Date().toISOString().split('T')[0]

        const todaySessions = await db
            .select({
                id: bookingSessions.id,
                date: bookingSessions.date,
                startTime: bookingSessions.from,
                endTime: bookingSessions.to,
                status: bookingSessions.status,
                bookingId: bookings.id,
                price: bookings.price,
                packageName: packages.name,
                programName: programs.name,
                branchName: branchTranslations.name,
                sportName: sportTranslations.name,
                athleteName: profiles.name,
                athletePhone: users.phoneNumber,
            })
            .from(bookingSessions)
            .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
            .innerJoin(packages, eq(bookings.packageId, packages.id))
            .innerJoin(programs, eq(packages.programId, programs.id))
            .innerJoin(branches, eq(programs.branchId, branches.id))
            .innerJoin(branchTranslations, and(
                eq(branches.id, branchTranslations.branchId),
                eq(branchTranslations.locale, 'en')
            ))
            .innerJoin(sports, eq(programs.sportId, sports.id))
            .innerJoin(sportTranslations, and(
                eq(sports.id, sportTranslations.sportId),
                eq(sportTranslations.locale, 'en')
            ))
            .leftJoin(profiles, eq(bookings.profileId, profiles.id))
            .leftJoin(users, eq(profiles.userId, users.id))
            .where(and(
                eq(programs.academicId, academy.id),
                sql`DATE(${bookingSessions.date}) = '${today}'::date`
            ))
            .orderBy(bookingSessions.from)

        const optimizedSessions: OptimizedBookingSession[] = todaySessions.map(session => ({
            id: session.id,
            date: new Date(session.date),
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status,
            booking: {
                id: session.bookingId,
                price: session.price,
                packageName: session.packageName,
                programName: session.programName || '',
                branchName: session.branchName,
                sportName: session.sportName,
                athleteName: session.athleteName || 'Unknown',
                athletePhone: session.athletePhone
            }
        }))

        return { data: optimizedSessions, error: null }

    } catch (error) {
        console.error('Error fetching today sessions:', error)
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
})

// Bulk delete optimized
export const deleteBookingsOptimized = async (ids: number[]): Promise<{
    success: boolean,
    error: string | null
}> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { success: false, error: 'Academy not found or requires redirect' }
        }

        await db.delete(bookings)
            .where(inArray(bookings.id, ids))

        return { success: true, error: null }

    } catch (error) {
        console.error('Error deleting bookings:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete bookings'
        }
    }
}

// Optimized search athletes function
export const searchAthletesOptimized = cache(async (query: string): Promise<{
    data: Array<{
        id: number | null
        name: string | null
        phone: string | null
        image: string | null
        birthday: string | null
        academicAthleticId: number
    }>,
    error: string | null
}> => {
    if (!query || query.length < 3) {
        return { data: [], error: null }
    }

    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { data: [], error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        const athletes = await db
            .select({
                id: profiles.id,
                name: profiles.name,
                phone: users.phoneNumber,
                image: profiles.image,
                birthday: profiles.birthday,
                academicAthleticId: academicAthletic.id,
            })
            .from(academicAthletic)
            .leftJoin(users, eq(academicAthletic.userId, users.id))
            .leftJoin(profiles, eq(academicAthletic.profileId, profiles.id))
            .where(and(
                eq(academicAthletic.academicId, academy.id),
                sql`(
                    ${users.phoneNumber} ILIKE ${`%${query}%`} OR
                    ${profiles.name} ILIKE ${`%${query}%`} OR
                    ${academicAthletic.firstGuardianPhone} ILIKE ${`%${query}%`}
                )`
            ))
            .limit(10)

        return { data: athletes, error: null }

    } catch (error) {
        console.error('Error searching athletes:', error)
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Search failed'
        }
    }
}) 