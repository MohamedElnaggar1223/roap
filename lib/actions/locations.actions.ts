'use server'
import { db } from '@/db'
import { branches, branchTranslations, branchFacility, branchSport } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { slugify } from '../utils'

export async function getLocations() {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
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
            sports: sql<number[]>`(
                SELECT JSON_ARRAYAGG(sport_id) 
                FROM ${branchSport}
                WHERE ${branchSport.branchId} = ${branches.id}
            )`,
            amenities: sql<number[]>`(
                SELECT JSON_ARRAYAGG(facility_id)
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
    facilities: number[] // Add facilities/amenities support
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    // Get the user's academy
    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found' }

    // If this is set as default, remove default from other branches
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
            slug: slugify(data.name),
            academicId: academy.id, // Link to academy
        })
        .returning({
            id: branches.id,
        })

    await db.insert(branchTranslations).values({
        branchId: branch.id,
        locale: 'en',
        name: data.name,
    })

    // Add sports
    if (data.sports.length) {
        await db.insert(branchSport).values(
            data.sports.map(sportId => ({
                branchId: branch.id,
                sportId,
            }))
        )
    }

    // Add facilities
    if (data.facilities.length) {
        await db.insert(branchFacility).values(
            data.facilities.map(facilityId => ({
                branchId: branch.id,
                facilityId,
            }))
        )
    }

    revalidatePath('/academy/locations')
    return { data: branch }
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

    // Get the user's academy
    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found' }

    // If this is set as default, remove default from other branches
    if (data.isDefault) {
        await db
            .update(branches)
            .set({ isDefault: false })
            .where(
                and(
                    eq(branches.academicId, academy.id),
                    eq(branches.id, id)
                )
            )
    }

    await db
        .update(branches)
        .set({
            nameInGoogleMap: data.nameInGoogleMap,
            url: data.url,
            isDefault: data.isDefault ? true : false,
        })
        .where(eq(branches.id, id))

    await db
        .update(branchTranslations)
        .set({
            name: data.name,
        })
        .where(
            and(
                eq(branchTranslations.branchId, id),
                eq(branchTranslations.locale, 'en')
            )
        )

    // Update sports
    await db.delete(branchSport).where(eq(branchSport.branchId, id))
    if (data.sports.length) {
        await db.insert(branchSport).values(
            data.sports.map(sportId => ({
                branchId: id,
                sportId,
            }))
        )
    }

    // Update facilities
    await db.delete(branchFacility).where(eq(branchFacility.branchId, id))
    if (data.facilities.length) {
        await db.insert(branchFacility).values(
            data.facilities.map(facilityId => ({
                branchId: id,
                facilityId,
            }))
        )
    }

    revalidatePath('/academy/locations')
    return { success: true }
}

export async function deleteLocation(id: number) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    await db.delete(branches).where(eq(branches.id, id))

    revalidatePath('/academy/locations')
    return { success: true }
}