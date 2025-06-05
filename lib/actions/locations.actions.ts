'use server'
import { db } from '@/db'
import { branches, branchTranslations, branchFacility, branchSport, programs, reviews, entryFeesHistory, branchSportDeletionLog } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, inArray, like, not, sql } from 'drizzle-orm'
import { revalidateTag, unstable_cache } from 'next/cache'
import { slugify } from '../utils'
import { cookies } from 'next/headers'
import { fetchPlaceInformation, getPlaceId } from './reviews.actions'

const getLocationsAction = async (academicId: number) => {
    return unstable_cache(async (academicId: number) => {
        // ULTRA-OPTIMIZED: Use materialized view for instant location data access
        const locationsData = await db
            .select({
                id: sql<number>`id`,
                name: sql<string>`name`,
                locale: sql<string>`locale`,
                nameInGoogleMap: sql<string>`name_in_google_map`,
                url: sql<string>`url`,
                isDefault: sql<boolean>`is_default`,
                rate: sql<number>`rate`,
                hidden: sql<boolean>`hidden`,
                createdAt: sql<string>`created_at`,
                sports: sql<string[]>`sports_str`, // Pre-computed string array
                facilities: sql<number[]>`facilities`,
                amenities: sql<string[]>`amenities`, // Pre-computed string array for UI compatibility
            })
            .from(sql`mv_location_details`)
            .where(sql`academic_id = ${academicId}`)

        return {
            data: locationsData,
            error: null
        }
    }, [`locations-${academicId.toString()}`], { tags: [`locations-${academicId.toString()}`], revalidate: 300 })(academicId) // Increased cache time since materialized view is already optimized
}

export async function getLocations() {
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

    const locations = await getLocationsAction(academic.id)

    return locations
}

async function manageAssessmentPrograms(tx: any, branchId: number, academicId: number, sportIds: number[]) {
    const existingPrograms = await tx
        .select({ branchId: programs.branchId, sportId: programs.sportId })
        .from(programs)
        .where(
            and(
                eq(programs.branchId, branchId),
                inArray(programs.sportId, sportIds),
                like(programs.name, '%Assessment%')
            )
        );

    const existingCombinations = new Set(
        existingPrograms.map((prog: any) => `${prog.branchId}-${prog.sportId}`)
    );

    const newSportIds = sportIds.filter(
        sportId => !existingCombinations.has(`${branchId}-${sportId}`)
    );

    if (newSportIds.length > 0) {
        await tx.insert(programs).values(
            newSportIds.map(sportId => ({
                name: 'Assessment',
                type: 'TEAM',
                academicId: academicId,
                branchId: branchId,
                sportId: sportId,
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            }))
        );
    }
}

export async function createLocation(data: {
    name: string
    nameInGoogleMap: string
    url: string
    isDefault: boolean
    sports: number[]
    facilities: number[]
    latitude?: string
    longitude?: string
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

            if (!academy) return { error: 'Academy not found' }

            const slug = slugify(data.name)
            /*const existingBranch = await tx.query.branches.findFirst({
                where: (branches, { eq }) => eq(branches.slug, slug)
            })

            if (existingBranch) {
                return {
                    error: 'A location with this name already exists',
                    field: 'name'
                }
            }*/

            if (data.isDefault) {
                await db
                    .update(branches)
                    .set({ isDefault: false })
                    .where(eq(branches.academicId, academy.id))
            }

            // OPTIMIZED: Fetch external data in parallel
            const [ratesAndReviews, placeId] = await Promise.all([
                fetchPlaceInformation(data.nameInGoogleMap),
                getPlaceId(data.nameInGoogleMap)
            ])

            const [branch] = await tx
                .insert(branches)
                .values({
                    nameInGoogleMap: data.nameInGoogleMap,
                    url: data.url,
                    isDefault: data.isDefault ? true : false,
                    slug,
                    academicId: academy.id,
                    latitude: ratesAndReviews?.latitude?.toString() ?? '',
                    longitude: ratesAndReviews?.longitude?.toString() ?? '',
                    rate: ratesAndReviews?.rating ?? null,
                    reviews: ratesAndReviews?.reviews?.length ?? null,
                    placeId: placeId ?? null,
                })
                .returning({
                    id: branches.id,
                })

            // OPTIMIZED: Combine all database insertions in parallel
            await Promise.all([
                // Insert branch translations
                tx.insert(branchTranslations).values({
                    branchId: branch.id,
                    locale: 'en',
                    name: data.name,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`,
                }),

                // Insert reviews if available
                ratesAndReviews?.reviews && placeId ?
                    tx.insert(reviews).values(
                        ratesAndReviews.reviews.map(review => ({
                            branchId: branch.id,
                            placeId: placeId,
                            authorName: review.author_name,
                            authorUrl: review.author_url || null,
                            language: review.language || 'en',
                            originalLanguage: review.original_language || review.language || 'en',
                            profilePhotoUrl: review.profile_photo_url || null,
                            rating: review.rating,
                            relativeTimeDescription: review.relative_time_description,
                            text: review.text,
                            time: review.time,
                            translated: review.translated || false,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`
                        }))
                    ) : Promise.resolve(),

                // Insert branch sports
                data.sports.length > 0 ?
                    tx.insert(branchSport)
                        .values(
                            data.sports.map(sportId => ({
                                branchId: branch.id,
                                sportId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                // Insert branch facilities
                data.facilities.length > 0 ?
                    tx.insert(branchFacility)
                        .values(
                            data.facilities.map(facilityId => ({
                                branchId: branch.id,
                                facilityId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                // Manage assessment programs
                data.sports.length > 0 ?
                    manageAssessmentPrograms(tx, branch.id, academy.id, data.sports) : Promise.resolve()
            ])


            return { data: branch, error: null, field: null }
        })
    } catch (error) {
        console.error('Error creating location:', error)
        if ((error as any)?.code === '23505' && (error as any)?.constraint === 'branches_slug_unique') {
            return {
                error: 'A location with this name already exists',
                field: 'name'
            }
        }
        return { error: 'Failed to create location' }
    }
    finally {
        revalidateTag(`locations-${academy?.id}`)
        revalidateTag(`programs-${academy?.id}`)
    }
}

export async function updateLocation(id: number, data: {
    name: string
    nameInGoogleMap: string
    url: string
    isDefault: boolean
    sports: number[]
    facilities: number[]
    latitude?: string
    longitude?: string
}, headers: { 'x-forwarded-for'?: string } | null = null) {
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

    if (!academy) return { error: 'Academy not found' }

    // const ratesAndReviews = await fetchPlaceInformation(data.nameInGoogleMap)
    // const placeId = await getPlaceId(data.nameInGoogleMap)

    try {
        await Promise.all([
            data.isDefault ? db
                .update(branches)
                .set({ isDefault: false, updatedAt: sql`now()` })
                .where(
                    and(
                        eq(branches.academicId, academy.id),
                        not(eq(branches.id, id))
                    )
                ) : Promise.resolve(),

            db.update(branches)
                .set({
                    nameInGoogleMap: data.nameInGoogleMap,
                    url: data.url,
                    isDefault: data.isDefault,
                    updatedAt: sql`now()`,
                    // latitude: ratesAndReviews?.latitude?.toString() ?? '',
                    // longitude: ratesAndReviews?.longitude?.toString() ?? '',
                    // rate: ratesAndReviews?.rating ?? null,
                    // reviews: ratesAndReviews?.reviews?.length ?? null,
                    // placeId: placeId ?? null,
                })
                .where(eq(branches.id, id)),

            // (async () => {
            //     if (ratesAndReviews?.reviews && placeId) {
            //         // First, delete existing reviews for this branch
            //         await db.delete(reviews)
            //             .where(eq(reviews.branchId, id))

            //         // Then insert new reviews
            //         await db.insert(reviews).values(
            //             ratesAndReviews.reviews.map(review => ({
            //                 branchId: id,
            //                 placeId: placeId,
            //                 authorName: review.author_name,
            //                 authorUrl: review.author_url || null,
            //                 language: review.language || 'en',
            //                 originalLanguage: review.original_language || review.language || 'en',
            //                 profilePhotoUrl: review.profile_photo_url || null,
            //                 rating: review.rating,
            //                 relativeTimeDescription: review.relative_time_description,
            //                 text: review.text,
            //                 time: review.time,
            //                 translated: review.translated || false,
            //                 createdAt: sql`now()`,
            //                 updatedAt: sql`now()`
            //             }))
            //         )
            //     }
            // })(),

            db.update(branchTranslations)
                .set({
                    name: data.name,
                    updatedAt: sql`now()`
                })
                .where(
                    and(
                        eq(branchTranslations.branchId, id),
                        eq(branchTranslations.locale, 'en')
                    )
                )
        ])

        // OPTIMIZED: Get existing data with our improved indexes
        const [existingSports, existingFacilities] = await Promise.all([
            db
                .select({ sportId: branchSport.sportId })
                .from(branchSport)
                .where(eq(branchSport.branchId, id)),

            db
                .select({ facilityId: branchFacility.facilityId })
                .from(branchFacility)
                .where(eq(branchFacility.branchId, id))
        ])

        const existingSportIds = existingSports.map(s => s.sportId)
        const existingFacilityIds = existingFacilities.map(f => f.facilityId)

        const sportsToAdd = data.sports.filter(id => !existingSportIds.includes(typeof id === 'string' ? parseInt(id) : id))
        const sportsToRemove = existingSportIds.filter(id => !data.sports.includes(typeof id === 'string' ? parseInt(id) : id))
        const facilitiesToAdd = data.facilities.filter(id => !existingFacilityIds.includes(typeof id === 'string' ? parseInt(id) : id))
        const facilitiesToRemove = existingFacilityIds.filter(id => !data.facilities.includes(id))

        console.log("Sports to remove", sportsToRemove)

        const clientIp = headers?.['x-forwarded-for']?.split(',')[0] || '0.0.0.0'

        // OPTIMIZED: Batch operations more efficiently
        await Promise.all([
            // Manage assessment programs
            manageAssessmentPrograms(db, id, academy.id, data.sports),

            // Add new sports
            sportsToAdd.length > 0 ?
                db.insert(branchSport)
                    .values(sportsToAdd.map(sportId => ({
                        branchId: typeof id === 'string' ? parseInt(id) : id,
                        sportId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`,
                    }))) : Promise.resolve(),

            // Add new facilities
            facilitiesToAdd.length > 0 ?
                db.insert(branchFacility)
                    .values(facilitiesToAdd.map(facilityId => ({
                        branchId: id,
                        facilityId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`,
                    }))) : Promise.resolve(),

            // Remove facilities
            facilitiesToRemove.length > 0 ?
                db.delete(branchFacility)
                    .where(and(
                        eq(branchFacility.branchId, id),
                        inArray(branchFacility.facilityId, facilitiesToRemove)
                    )) : Promise.resolve(),

            // Remove sports (complex operation kept separate for data integrity)
            sportsToRemove.length > 0 ?
                db.transaction(async (tx) => {
                    // First, log the deletions
                    const sportsToLog = existingSports.filter(s => sportsToRemove.includes(s.sportId))

                    await Promise.all([
                        // Log deletions
                        tx.insert(branchSportDeletionLog).values(
                            sportsToLog.map(sport => ({
                                deleted_row_data: { sportId: sport.sportId, branchId: id },
                                deleted_by_ip: clientIp as any,
                                academy_id: academy.id,
                                deleted_at: sql`now()`
                            }))
                        ),

                        // Delete related entry fees history
                        tx.delete(entryFeesHistory)
                            .where(and(
                                inArray(entryFeesHistory.programId,
                                    db.select({ id: programs.id })
                                        .from(programs)
                                        .where(and(
                                            eq(programs.branchId, id),
                                            inArray(programs.sportId, sportsToRemove)
                                        ))
                                )
                            )),

                        // Delete programs
                        tx.delete(programs)
                            .where(and(
                                eq(programs.branchId, id),
                                inArray(programs.sportId, sportsToRemove)
                            )),

                        // Delete from branch_sport
                        tx.delete(branchSport)
                            .where(and(
                                eq(branchSport.branchId, id),
                                inArray(branchSport.sportId, sportsToRemove)
                            ))
                    ])
                }) : Promise.resolve()
        ])

        // revalidatePath('/academy/locations')
        return { success: true }

    } catch (error) {
        console.error('Error updating location:', error)
        return { error: 'Failed to update location' }
    }
    finally {
        revalidateTag(`locations-${academy?.id}`)
        revalidateTag(`programs-${academy?.id}`)
    }
}

export async function toggleBranchVisibility(id: number) {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action' }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action' }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found' }

    try {
        // First get current hidden status
        const branch = await db.query.branches.findFirst({
            where: (branches, { eq }) => eq(branches.id, id),
            columns: {
                hidden: true
            }
        })

        if (!branch) return { error: 'Branch not found' }

        // Toggle the hidden status
        await db.update(branches)
            .set({
                hidden: !branch.hidden,
                updatedAt: sql`now()`
            })
            .where(eq(branches.id, id))

        revalidateTag(`locations-${academy.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error toggling branch visibility:', error)
        return { error: 'Failed to toggle branch visibility' }
    }
}

export async function deleteLocations(ids: number[]) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    await Promise.all(ids.map(async id => await db.delete(branches).where(eq(branches.id, id))))

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    revalidateTag(`locations-${academy?.id}`)
    return { success: true }
}