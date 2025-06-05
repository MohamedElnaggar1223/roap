'use server'

import { db } from '@/db'
import { academicAthletic, users, profiles, bookings, bookingSessions, packages, programs, branches, sports, branchTranslations, sportTranslations } from '@/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { checkAcademyStatus } from './check-academy-status'
import { cache } from 'react'

// Optimized types with better structure
export type OptimizedUser = {
    email: string | null
    phoneNumber: string | null
}

export type OptimizedProfile = {
    name: string | null
    gender: string | null
    birthday: string | null
    image: string | null
    country: string | null
    nationality: string | null
    city: string | null
    streetAddress: string | null
}

export type OptimizedBooking = {
    id: number
    price: number
    date: Date
    startTime: string
    endTime: string
    packageName: string
    branchName: string
    sportName: string
    programName: string | null
    programType: string | null
}

export type OptimizedAthlete = {
    id: number
    userId: number
    profileId: number | null
    certificate: string | null
    type: "primary" | "fellow"
    firstGuardianName: string | null
    firstGuardianRelationship: string | null
    secondGuardianName: string | null
    secondGuardianRelationship: string | null
    firstGuardianPhone: string | null
    secondGuardianPhone: string | null
    firstGuardianEmail: string | null
    secondGuardianEmail: string | null
    user: OptimizedUser
    profile: OptimizedProfile
    bookings: OptimizedBooking[]
}

// Cached function for better performance
export const getOptimizedAthletes = cache(async (): Promise<{ data: OptimizedAthlete[], error: string | null }> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { data: [], error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        // Step 1: Get basic athlete data with user and profile info
        // Removed complex joins to reduce query complexity
        const athletesData = await db
            .select({
                id: academicAthletic.id,
                userId: academicAthletic.userId,
                profileId: academicAthletic.profileId,
                certificate: academicAthletic.certificate,
                type: academicAthletic.type,
                firstGuardianName: academicAthletic.firstGuardianName,
                firstGuardianRelationship: academicAthletic.firstGuardianRelationship,
                secondGuardianName: academicAthletic.secondGuardianName,
                secondGuardianRelationship: academicAthletic.secondGuardianRelationship,
                firstGuardianPhone: academicAthletic.firstGuardianPhone,
                secondGuardianPhone: academicAthletic.secondGuardianPhone,
                firstGuardianEmail: academicAthletic.firstGuardianEmail,
                secondGuardianEmail: academicAthletic.secondGuardianEmail,
                userEmail: users.email,
                userPhone: users.phoneNumber,
                profileName: profiles.name,
                profileGender: profiles.gender,
                profileBirthday: profiles.birthday,
                profileImage: profiles.image,
                profileCountry: profiles.country,
                profileNationality: profiles.nationality,
                profileCity: profiles.city,
                profileStreetAddress: profiles.streetAddress,
            })
            .from(academicAthletic)
            .leftJoin(users, eq(academicAthletic.userId, users.id))
            .leftJoin(profiles, eq(academicAthletic.profileId, profiles.id))
            .where(eq(academicAthletic.academicId, academy.id))

        if (athletesData.length === 0) {
            return { data: [], error: null }
        }

        // Step 2: Get bookings data separately - more efficient than complex join
        const profileIds = athletesData
            .map(a => a.profileId)
            .filter((id): id is number => id !== null)

        let bookingsData: any[] = []
        if (profileIds.length > 0) {
            // Optimized booking query with minimal joins
            bookingsData = await db
                .select({
                    bookingId: bookings.id,
                    profileId: bookings.profileId,
                    price: bookings.price,
                    sessionDate: bookingSessions.date,
                    sessionFrom: bookingSessions.from,
                    sessionTo: bookingSessions.to,
                    packageName: packages.name,
                    programName: programs.name,
                    programType: programs.type,
                    branchName: branchTranslations.name,
                    sportName: sportTranslations.name,
                })
                .from(bookings)
                .innerJoin(bookingSessions, eq(bookings.id, bookingSessions.bookingId))
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
                .where(inArray(bookings.profileId, profileIds))
                .orderBy(desc(bookingSessions.date))
        }

        // Step 3: Efficiently group bookings by profile ID
        const bookingsByProfile = bookingsData.reduce((acc, booking) => {
            if (!acc[booking.profileId]) {
                acc[booking.profileId] = []
            }
            acc[booking.profileId].push({
                id: booking.bookingId,
                price: booking.price,
                date: new Date(booking.sessionDate),
                startTime: booking.sessionFrom,
                endTime: booking.sessionTo,
                packageName: booking.packageName,
                branchName: booking.branchName,
                sportName: booking.sportName,
                programName: booking.programName,
                programType: booking.programType,
            })
            return acc
        }, {} as Record<number, OptimizedBooking[]>)

        // Step 4: Build final athlete objects
        const athletes: OptimizedAthlete[] = athletesData.map(row => ({
            id: row.id,
            userId: row.userId,
            profileId: row.profileId,
            certificate: row.certificate,
            type: row.type ?? 'primary',
            firstGuardianName: row.firstGuardianName,
            firstGuardianRelationship: row.firstGuardianRelationship,
            secondGuardianName: row.secondGuardianName,
            secondGuardianRelationship: row.secondGuardianRelationship,
            firstGuardianPhone: row.firstGuardianPhone,
            firstGuardianEmail: row.firstGuardianEmail,
            secondGuardianEmail: row.secondGuardianEmail,
            secondGuardianPhone: row.secondGuardianPhone,
            user: {
                email: row.userEmail,
                phoneNumber: row.userPhone
            },
            profile: {
                name: row.profileName,
                gender: row.profileGender,
                birthday: row.profileBirthday,
                image: row.profileImage,
                country: row.profileCountry,
                nationality: row.profileNationality,
                city: row.profileCity,
                streetAddress: row.profileStreetAddress
            },
            bookings: row.profileId ? (bookingsByProfile[row.profileId] || []) : []
        }))

        return { data: athletes, error: null }

    } catch (error) {
        console.error('Error fetching optimized athletes:', error)
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
})

// Optimized function to get athlete count only (for statistics)
export const getAthleteCount = cache(async (): Promise<number> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) return 0

        const academy = { id: academyResult.academyId }

        const [result] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(academicAthletic)
            .where(eq(academicAthletic.academicId, academy.id))

        return result.count
    } catch (error) {
        console.error('Error fetching athlete count:', error)
        return 0
    }
})

// Optimized function to get recent athlete bookings (for dashboard)
export const getRecentAthleteBookings = cache(async (limit: number = 10): Promise<OptimizedBooking[]> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) return []

        const academy = { id: academyResult.academyId }

        const recentBookings = await db
            .select({
                id: bookings.id,
                price: bookings.price,
                sessionDate: bookingSessions.date,
                sessionFrom: bookingSessions.from,
                sessionTo: bookingSessions.to,
                packageName: packages.name,
                programName: programs.name,
                programType: programs.type,
                branchName: branchTranslations.name,
                sportName: sportTranslations.name,
            })
            .from(bookings)
            .innerJoin(bookingSessions, eq(bookings.id, bookingSessions.bookingId))
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
            .innerJoin(academicAthletic, eq(bookings.profileId, academicAthletic.profileId))
            .where(eq(academicAthletic.academicId, academy.id))
            .orderBy(desc(bookingSessions.date))
            .limit(limit)

        return recentBookings.map(booking => ({
            id: booking.id,
            price: booking.price,
            date: new Date(booking.sessionDate),
            startTime: booking.sessionFrom,
            endTime: booking.sessionTo,
            packageName: booking.packageName,
            branchName: booking.branchName,
            sportName: booking.sportName,
            programName: booking.programName,
            programType: booking.programType,
        }))

    } catch (error) {
        console.error('Error fetching recent athlete bookings:', error)
        return []
    }
}) 