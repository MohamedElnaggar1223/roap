'use server'
import { formatDateForDB } from './../utils';
import { db } from '@/db'
import { coaches, coachSport, coachSpokenLanguage, coachPackage, coachProgram } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { cookies } from 'next/headers';

export async function getAllCoaches(url: string | null) {
    if (!url) return
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return null
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) return null

    const academyCoaches = await db
        .select({
            id: coaches.id,
            name: coaches.name,
            image: coaches.image,
            title: coaches.title,
            gender: coaches.gender,
            dateOfBirth: coaches.dateOfBirth,
        })
        .from(coaches)
        .where(eq(coaches.academicId, academic.id))

    return academyCoaches
}

export async function getCoachById(id: number) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const coach = await db.query.coaches.findFirst({
        where: (coaches, { eq }) => eq(coaches.id, id),
    })

    if (!coach) {
        return { error: 'Coach not found' }
    }

    return { data: coach }
}

const getCoachesAction = async (academicId: number) => {
    return unstable_cache(async (academicId: number) => {
        const coachesList = await db
            .select({
                id: coaches.id,
                name: coaches.name,
                title: coaches.title,
                image: coaches.image,
                bio: coaches.bio,
                gender: coaches.gender,
                dateOfBirth: coaches.dateOfBirth,
                privateSessionPercentage: coaches.privateSessionPercentage,
                sports: sql<number[]>`(
                SELECT COALESCE(array_agg(sport_id::integer), ARRAY[]::integer[])
                FROM ${coachSport}
                WHERE ${coachSport.coachId} = coaches.id
            )`,
                languages: sql<number[]>`(
                SELECT COALESCE(array_agg(spoken_language_id::integer), ARRAY[]::integer[])
                FROM ${coachSpokenLanguage}
                WHERE ${coachSpokenLanguage.coachId} = coaches.id
            )`,
                packages: sql<number[]>`(
                SELECT COALESCE(array_agg(package_id::integer), ARRAY[]::integer[])
                FROM ${coachPackage}
                WHERE ${coachPackage.coachId} = coaches.id
            )`
            })
            .from(coaches)
            .where(eq(coaches.academicId, academicId))

        return {
            data: coachesList.map(coach => ({
                ...coach,
                sports: coach.sports || [],
                languages: coach.languages || [],
                packages: coach.packages || []
            })),
            error: null
        }
    }, [`coaches-${academicId.toString()}`], { tags: [`coaches-${academicId.toString()}`], revalidate: 60 })(academicId)
}

export async function getCoaches() {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academic) {
        return { error: 'Academy not found', data: null }
    }

    const coaches = await getCoachesAction(academic.id)

    return coaches
}

export async function createCoach(data: {
    name: string
    title: string
    image: string
    bio: string
    gender: string
    dateOfBirth: Date | undefined
    privateSessionPercentage: string
    sports: number[]
    languages: number[]
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    try {
        return await db.transaction(async (tx) => {

            if (!academy) return { error: 'Academy not found', field: 'root' }

            const [coach] = await tx
                .insert(coaches)
                .values({
                    name: data.name,
                    title: data.title,
                    image: data.image ? 'images/' + data.image : null,
                    bio: data.bio,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth ? formatDateForDB(data.dateOfBirth) : null,
                    privateSessionPercentage: data.privateSessionPercentage + '%',
                    academicId: academy.id,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                })
                .returning({
                    id: coaches.id,
                })

            await Promise.all([
                data.sports.length > 0 ?
                    tx.insert(coachSport)
                        .values(
                            data.sports.map(sportId => ({
                                coachId: coach.id,
                                sportId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                data.languages.length > 0 ?
                    tx.insert(coachSpokenLanguage)
                        .values(
                            data.languages.map(languageId => ({
                                coachId: coach.id,
                                spokenLanguageId: languageId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve()
            ])

            return { data: coach, error: null }
        })
    } catch (error) {
        console.error('Error creating coach:', error)
        return { error: 'Failed to create coach', field: 'root' }
    }
    finally {
        // revalidatePath('/academy/coaches')
        revalidateTag(`coaches-${academy?.id}`)
    }
}

export async function updateCoach(id: number, data: {
    name: string
    title: string
    image: string
    bio: string
    gender: string
    dateOfBirth: Date | undefined
    privateSessionPercentage: string
    sports: number[]
    languages: number[]
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found', field: 'root' }

    console.log(data.image)

    try {
        await db.update(coaches)
            .set({
                name: data.name,
                title: data.title,
                image: data.image ? data.image.includes('images/') ? data.image.startsWith('images/') ? data.image : 'images/' + data.image?.split('images/')[1] : 'images/' + data.image : null,
                bio: data.bio,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth ? formatDateForDB(data.dateOfBirth) : null,
                privateSessionPercentage: data.privateSessionPercentage + '%',
                updatedAt: sql`now()`
            })
            .where(eq(coaches.id, id))

        const [existingSports, existingLanguages] = await Promise.all([
            db
                .select({ sportId: coachSport.sportId })
                .from(coachSport)
                .where(eq(coachSport.coachId, id)),

            db
                .select({ languageId: coachSpokenLanguage.spokenLanguageId })
                .from(coachSpokenLanguage)
                .where(eq(coachSpokenLanguage.coachId, id))
        ])

        const existingSportIds = existingSports.map(s => s.sportId)
        const existingLanguageIds = existingLanguages.map(l => l.languageId)

        const sportsToAdd = data.sports.filter(id => !existingSportIds.includes(id))
        const sportsToRemove = existingSportIds.filter(id => !data.sports.includes(id))
        const languagesToAdd = data.languages.filter(id => !existingLanguageIds.includes(id))
        const languagesToRemove = existingLanguageIds.filter(id => !data.languages.includes(id))

        await Promise.all([
            sportsToRemove.length > 0 ?
                db.delete(coachSport)
                    .where(and(
                        eq(coachSport.coachId, id),
                        inArray(coachSport.sportId, sportsToRemove)
                    )) : Promise.resolve(),

            sportsToAdd.length > 0 ?
                db.insert(coachSport)
                    .values(sportsToAdd.map(sportId => ({
                        coachId: id,
                        sportId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`,
                    }))) : Promise.resolve(),

            languagesToRemove.length > 0 ?
                db.delete(coachSpokenLanguage)
                    .where(and(
                        eq(coachSpokenLanguage.coachId, id),
                        inArray(coachSpokenLanguage.spokenLanguageId, languagesToRemove)
                    )) : Promise.resolve(),

            languagesToAdd.length > 0 ?
                db.insert(coachSpokenLanguage)
                    .values(languagesToAdd.map(languageId => ({
                        coachId: id,
                        spokenLanguageId: languageId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`,
                    }))) : Promise.resolve()
        ])

        // revalidatePath('/academy/coaches')
        return { success: true }

    } catch (error) {
        console.error('Error updating coach:', error)
        return { error: 'Failed to update coach', field: 'root' }
    }
    finally {
        revalidateTag(`coaches-${academy?.id}`)
    }
}

export async function deleteCoaches(ids: number[]) {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found' }

    try {
        // Begin a transaction to ensure all operations succeed or none do
        await db.transaction(async (tx) => {
            for (const id of ids) {
                // Delete related records in coach_program
                await tx.delete(coachProgram)
                    .where(eq(coachProgram.coachId, id))

                // Delete related records in coach_package
                await tx.delete(coachPackage)
                    .where(eq(coachPackage.coachId, id))

                // Delete related records in coach_spoken_language
                await tx.delete(coachSpokenLanguage)
                    .where(eq(coachSpokenLanguage.coachId, id))

                // Delete related records in coach_sport
                await tx.delete(coachSport)
                    .where(eq(coachSport.coachId, id))

                // Finally delete the coach
                await tx.delete(coaches)
                    .where(eq(coaches.id, id))
            }
        })

        revalidateTag(`coaches-${academy?.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting coaches:', error)
        return { error: 'Failed to delete coaches', field: null, data: [] }
    }
}