'use server'
import { db } from '@/db'
import { academicAthletic, bookings, bookingSessions, branches, branchTranslations, packages, profiles, programs, sports, sportTranslations, users } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidateTag, unstable_cache } from 'next/cache'
import { formatDateForDB } from '../utils'

export type User = {
    email: string | null
    phoneNumber: string | null
}

export type Profile = {
    name: string | null
    gender: string | null
    birthday: string | null
    image: string | null
}

export type Booking = {
    id: number
    price: number
    date: Date
    startTime: string
    endTime: string
    packageName: string
    branchName: string
    sportName: string
    programName: string | null
}

export type Athlete = {
    id: number
    userId: number
    profileId: number | null
    certificate: string | null
    type: "primary" | "fellow"
    firstGuardianName: string | null
    firstGuardianRelationship: string | null
    secondGuardianName: string | null
    secondGuardianRelationship: string | null
    user: User
    profile: Profile
    bookings: Booking[]
}

export const getAthletesAction = async (academicId: number) => {
    return unstable_cache(
        async (academicId: number) => {
            const results = await db
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
                    user: {
                        email: users.email,
                        phoneNumber: users.phoneNumber,
                    },
                    profile: {
                        name: profiles.name,
                        gender: profiles.gender,
                        birthday: profiles.birthday,
                        image: profiles.image,
                    },
                    booking: {
                        id: bookings.id,
                        price: bookings.price,
                        date: bookingSessions.date,
                        startTime: bookingSessions.from,
                        endTime: bookingSessions.to,
                        packageName: packages.name,
                        branchName: sql<string>`branch_translations.name`,
                        sportName: sql<string>`sport_translations.name`,
                        programName: programs.name,
                    }
                })
                .from(academicAthletic)
                .leftJoin(users, eq(academicAthletic.userId, users.id))
                .leftJoin(profiles, eq(academicAthletic.profileId, profiles.id))
                .leftJoin(bookings, eq(profiles.id, bookings.profileId))
                .leftJoin(bookingSessions, eq(bookings.id, bookingSessions.bookingId))
                .leftJoin(packages, eq(bookings.packageId, packages.id))
                .leftJoin(programs, eq(packages.programId, programs.id))
                .leftJoin(branches, eq(programs.branchId, branches.id))
                .leftJoin(
                    branchTranslations,
                    and(
                        eq(branches.id, branchTranslations.branchId),
                        eq(branchTranslations.locale, 'en')
                    )
                )
                .leftJoin(sports, eq(programs.sportId, sports.id))
                .leftJoin(
                    sportTranslations,
                    and(
                        eq(sports.id, sportTranslations.sportId),
                        eq(sportTranslations.locale, 'en')
                    )
                )
                .where(eq(academicAthletic.academicId, academicId))

            const athletes = results.reduce((acc: Athlete[], row) => {
                let athlete = acc.find(a => a.id === row.id)

                if (!athlete) {
                    athlete = {
                        id: row.id,
                        userId: row.userId,
                        profileId: row.profileId,
                        certificate: row.certificate,
                        type: row.type ?? 'primary',
                        firstGuardianName: row.firstGuardianName,
                        firstGuardianRelationship: row.firstGuardianRelationship,
                        secondGuardianName: row.secondGuardianName,
                        secondGuardianRelationship: row.secondGuardianRelationship,
                        user: row.user ?? { email: null, phoneNumber: null },
                        profile: row.profile ?? { name: null, gender: null, birthday: null, image: null },
                        bookings: []
                    }
                    acc.push(athlete)
                }

                if (row.booking.id) {
                    const bookingExists = athlete.bookings.some((b: Booking) => b.id === row.booking.id && typeof row.booking.id === 'number')
                    if (!bookingExists) {
                        athlete.bookings.push(row.booking as unknown as Booking)
                    }
                }

                return acc
            }, [])

            return { data: athletes, error: null }
        },
        [`athletes-${academicId.toString()}`],
        {
            tags: [`athletes-${academicId.toString()}`],
            revalidate: 3600
        }
    )(academicId)
}

export async function getAthletes() {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', data: null }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) {
        return { error: 'Academy not found', data: null }
    }

    const athletes = await getAthletesAction(academic.id)
    return athletes
}

export async function createAthlete(data: {
    email: string
    phoneNumber?: string
    name: string
    gender: string
    birthday: Date
    image: string
    certificate: string
    type: 'primary' | 'fellow'
    firstGuardianName?: string
    firstGuardianRelationship?: string
    secondGuardianName?: string
    secondGuardianRelationship?: string
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root' }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) return { error: 'Academy not found', field: 'root' }

    // Validate guardian information for fellow type
    if (data.type === 'fellow' && (!data.firstGuardianName || !data.firstGuardianRelationship)) {
        return {
            error: 'First guardian information is required for fellow athletes',
            field: !data.firstGuardianName ? 'firstGuardianName' : 'firstGuardianRelationship'
        }
    }

    try {
        return await db.transaction(async (tx) => {
            // Check if user with email already exists
            const existingUser = await tx
                .select({ id: users.id })
                .from(users)
                .where(eq(users.email, data.email))
                .limit(1)

            if (existingUser.length > 0) {
                return { error: 'User with this email already exists', field: 'email' }
            }

            // Create new user
            const [user] = await tx
                .insert(users)
                .values({
                    email: data.email,
                    phoneNumber: data.phoneNumber || null,
                    isAthletic: true,
                    role: 'user',
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                })
                .returning({ id: users.id })

            // Create profile for the user
            const [profile] = await tx
                .insert(profiles)
                .values({
                    userId: user.id,
                    name: data.name,
                    gender: data.gender,
                    birthday: formatDateForDB(data.birthday),
                    image: data.image ? 'images/' + data.image : null,
                    relationship: 'self',
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                })
                .returning({ id: profiles.id })

            // Create athlete record
            const [athlete] = await tx
                .insert(academicAthletic)
                .values({
                    academicId: academic.id,
                    userId: user.id,
                    profileId: profile.id,
                    certificate: data.certificate ? 'images/' + data.certificate : null,
                    type: data.type,
                    firstGuardianName: data.firstGuardianName || null,
                    firstGuardianRelationship: data.firstGuardianRelationship || null,
                    secondGuardianName: data.secondGuardianName || null,
                    secondGuardianRelationship: data.secondGuardianRelationship || null,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                })
                .returning({ id: academicAthletic.id })

            return { data: athlete, error: null }
        })
    } catch (error) {
        console.error('Error creating athlete:', error)
        return { error: 'Failed to create athlete', field: 'root' }
    }
    finally {
        revalidateTag(`athletes-${academic?.id}`)
    }
}

export async function updateAthlete(id: number, data: {
    email: string
    phoneNumber?: string
    name: string
    gender: string
    birthday: Date
    image: string
    certificate: string
    type: 'primary' | 'fellow'
    firstGuardianName?: string
    firstGuardianRelationship?: string
    secondGuardianName?: string
    secondGuardianRelationship?: string
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root' }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) return { error: 'Academy not found', field: 'root' }

    // Validate guardian information for fellow type
    if (data.type === 'fellow' && (!data.firstGuardianName || !data.firstGuardianRelationship)) {
        return {
            error: 'First guardian information is required for fellow athletes',
            field: !data.firstGuardianName ? 'firstGuardianName' : 'firstGuardianRelationship'
        }
    }

    try {
        return await db.transaction(async (tx) => {
            // Get the athlete record first to get userId and profileId
            const athlete = await tx
                .select({
                    userId: academicAthletic.userId,
                    profileId: academicAthletic.profileId,
                })
                .from(academicAthletic)
                .where(eq(academicAthletic.id, id))
                .limit(1)

            if (!athlete.length) {
                return { error: 'Athlete not found', field: 'root' }
            }

            const { userId, profileId } = athlete[0]

            // Check if email is already used by another user
            const existingUser = await tx
                .select({ id: users.id })
                .from(users)
                .where(and(
                    eq(users.email, data.email),
                    sql`${users.id} != ${userId}`
                ))
                .limit(1)

            if (existingUser.length > 0) {
                return { error: 'Email is already in use by another user', field: 'email' }
            }

            // Update user information
            await tx
                .update(users)
                .set({
                    email: data.email,
                    phoneNumber: data.phoneNumber || null,
                    updatedAt: sql`now()`
                })
                .where(eq(users.id, userId))

            // Update profile information
            if (profileId) {
                await tx
                    .update(profiles)
                    .set({
                        name: data.name,
                        gender: data.gender,
                        birthday: formatDateForDB(data.birthday),
                        image: data.image.includes('images/') ? data.image : 'images/' + data.image,
                        updatedAt: sql`now()`
                    })
                    .where(eq(profiles.id, profileId))
            }

            // Update athlete record with all fields including guardian information
            await tx
                .update(academicAthletic)
                .set({
                    certificate: data.certificate.includes('images/') ? data.certificate : 'images/' + data.certificate,
                    type: data.type,
                    firstGuardianName: data.firstGuardianName || null,
                    firstGuardianRelationship: data.firstGuardianRelationship || null,
                    secondGuardianName: data.secondGuardianName || null,
                    secondGuardianRelationship: data.secondGuardianRelationship || null,
                    updatedAt: sql`now()`
                })
                .where(eq(academicAthletic.id, id))

            return { success: true }
        })
    } catch (error) {
        console.error('Error updating athlete:', error)
        return { error: 'Failed to update athlete', field: 'root' }
    }
    finally {
        revalidateTag(`athletes-${academic?.id}`)
    }
}

export async function deleteAthletes(ids: number[]) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) return { error: 'Academy not found' }

    try {
        await db.transaction(async (tx) => {
            const athletes = await tx
                .select({
                    userId: academicAthletic.userId,
                    profileId: academicAthletic.profileId,
                })
                .from(academicAthletic)
                .where(inArray(academicAthletic.id, ids))

            await tx
                .delete(academicAthletic)
                .where(inArray(academicAthletic.id, ids))

            const profileIds = athletes.map(a => a.profileId).filter(Boolean) as number[]
            if (profileIds.length > 0) {
                await tx
                    .delete(profiles)
                    .where(inArray(profiles.id, profileIds))
            }

            const userIds = athletes.map(a => a.userId)
            await tx
                .delete(users)
                .where(inArray(users.id, userIds))
        })

        revalidateTag(`athletes-${academic?.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting athletes:', error)
        return { error: 'Failed to delete athletes' }
    }
}

export async function getAllProfiles() {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return null
    }

    const profilesData = await db
        .select({
            id: profiles.id,
            name: profiles.name,
            gender: profiles.gender,
            birthday: profiles.birthday,
            image: profiles.image,
            userId: profiles.userId,
        })
        .from(profiles)

    return profilesData
}