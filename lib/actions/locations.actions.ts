'use server'
import { db } from '@/db'
import { branches, branchTranslations, branchFacility, branchSport } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, inArray, not, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { slugify } from '../utils'

export async function getLocations() {
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

    if (!academic) {
        return { error: 'Academy not found' }
    }

    const locations = await db
        .select({
            id: branches.id,
            name: sql<string>`t.name`,
            locale: sql<string>`t.locale`,
            nameInGoogleMap: branches.nameInGoogleMap,
            url: branches.url,
            isDefault: branches.isDefault,
            rate: branches.rate,
            sports: sql<string[]>`(
                SELECT COALESCE(array_agg(sport_id), ARRAY[]::integer[])
                FROM ${branchSport}
                WHERE ${branchSport.branchId} = ${branches.id}
            )`,
            amenities: sql<string[]>`(
                SELECT COALESCE(array_agg(facility_id), ARRAY[]::integer[])
                FROM ${branchFacility}
                WHERE ${branchFacility.branchId} = ${branches.id}
            )`
        })
        .from(branches)
        .innerJoin(
            sql`(
                SELECT bt.branch_id, bt.name, bt.locale
                FROM ${branchTranslations} bt
                WHERE bt.locale = 'en'
                UNION
                SELECT bt2.branch_id, bt2.name, bt2.locale
                FROM ${branchTranslations} bt2
                INNER JOIN (
                    SELECT branch_id, MIN(locale) as first_locale
                    FROM ${branchTranslations}
                    WHERE branch_id NOT IN (
                        SELECT branch_id 
                        FROM ${branchTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY branch_id
                ) first_trans ON bt2.branch_id = first_trans.branch_id 
                AND bt2.locale = first_trans.first_locale
            ) t`,
            sql`t.branch_id = ${branches.id}`
        )
        .where(eq(branches.academicId, academic.id))

    // Transform null arrays to empty arrays
    const transformedLocations = locations.map(location => ({
        ...location,
        sports: location.sports || [],
        facilities: location.amenities || [],
    }))

    return {
        data: transformedLocations,
        error: null
    }
}

export async function createLocation(data: {
    name: string
    nameInGoogleMap: string
    url: string
    isDefault: boolean
    sports: number[]
    facilities: number[]
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root' }
    }

    try {
        return await db.transaction(async (tx) => {
            const academy = await tx.query.academics.findFirst({
                where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
                columns: {
                    id: true,
                }
            })

            if (!academy) return { error: 'Academy not found' }

            const slug = slugify(data.name)
            const existingBranch = await tx.query.branches.findFirst({
                where: (branches, { eq }) => eq(branches.slug, slug)
            })

            if (existingBranch) {
                return {
                    error: 'A location with this name already exists',
                    field: 'name'
                }
            }

            if (data.isDefault) {
                await db
                    .update(branches)
                    .set({ isDefault: false })
                    .where(eq(branches.academicId, academy.id))
            }

            const [branch] = await db
                .insert(branches)
                .values({
                    nameInGoogleMap: data.nameInGoogleMap,
                    url: data.url,
                    isDefault: data.isDefault ? true : false,
                    slug,
                    academicId: academy.id,
                })
                .returning({
                    id: branches.id,
                })

            await tx.insert(branchTranslations).values({
                branchId: branch.id,
                locale: 'en',
                name: data.name,
                createdAt: sql`now()`,
                updatedAt: sql`now()`,
            })

            await Promise.all([
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

                data.facilities.length > 0 ?
                    tx.insert(branchFacility)
                        .values(
                            data.facilities.map(facilityId => ({
                                branchId: branch.id,
                                facilityId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve()
            ])

            return { data: branch }
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
        revalidatePath('/academy/locations')
    }
}

export async function updateLocation(id: number, data: {
    name: string
    nameInGoogleMap: string
    url: string
    isDefault: boolean
    sports: number[]
    facilities: number[]
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found' }

    try {
        // Basic info updates
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
                    updatedAt: sql`now()`
                })
                .where(eq(branches.id, id)),

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

        const sportsToAdd = data.sports.filter(id => !existingSportIds.includes(id))
        const sportsToRemove = existingSportIds.filter(id => !data.sports.includes(id))
        const facilitiesToAdd = data.facilities.filter(id => !existingFacilityIds.includes(id))
        const facilitiesToRemove = existingFacilityIds.filter(id => !data.facilities.includes(id))

        await Promise.all([
            sportsToRemove.length > 0 ?
                db.delete(branchSport)
                    .where(and(
                        eq(branchSport.branchId, id),
                        inArray(branchSport.sportId, sportsToRemove)
                    )) : Promise.resolve(),

            sportsToAdd.length > 0 ?
                db.insert(branchSport)
                    .values(sportsToAdd.map(sportId => ({
                        branchId: id,
                        sportId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`,
                    }))) : Promise.resolve(),

            facilitiesToRemove.length > 0 ?
                db.delete(branchFacility)
                    .where(and(
                        eq(branchFacility.branchId, id),
                        inArray(branchFacility.facilityId, facilitiesToRemove)
                    )) : Promise.resolve(),

            facilitiesToAdd.length > 0 ?
                db.insert(branchFacility)
                    .values(facilitiesToAdd.map(facilityId => ({
                        branchId: id,
                        facilityId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`,
                    }))) : Promise.resolve()
        ])

        revalidatePath('/academy/locations')
        return { success: true }

    } catch (error) {
        console.error('Error updating location:', error)
        return { error: 'Failed to update location' }
    }
}

export async function deleteLocations(ids: number[]) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    await Promise.all(ids.map(async id => await db.delete(branches).where(eq(branches.id, id))))

    revalidatePath('/academy/locations')
    return { success: true }
}