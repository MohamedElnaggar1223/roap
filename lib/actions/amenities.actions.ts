'use server'

import { SQL, asc, eq, sql, inArray, and } from 'drizzle-orm'
import { db } from '@/db'
import { facilities, facilityTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { getImageUrl } from '../supabase-images'
import { revalidatePath } from 'next/cache'
import { withPaginatedCache } from '@/lib/cache/wrapper'
import { CACHE_KEYS, CACHE_TTL, CACHE_PATTERNS } from '@/lib/cache/keys'
import { invalidateFacilitiesCache } from '@/lib/cache/invalidation'

export async function getPaginatedFacilities(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(facilities.id)
) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: [],
        meta: {
            page: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
        },
    }

    const orderByStr = orderBy.toString()

    return await withPaginatedCache(
        CACHE_KEYS.PAGINATED_FACILITIES(page, pageSize, orderByStr),
        async () => {
            const offset = (page - 1) * pageSize

            const data = await db
                .select({
                    id: facilities.id,
                    name: sql<string>`t.name`,
                    locale: sql<string>`t.locale`,
                })
                .from(facilities)
                .innerJoin(
                    sql`(
                        SELECT ct.facility_id, ct.name, ct.locale
                        FROM ${facilityTranslations} ct
                        WHERE ct.locale = 'en'
                        UNION
                        SELECT ct2.facility_id, ct2.name, ct2.locale
                        FROM ${facilityTranslations} ct2
                        INNER JOIN (
                            SELECT facility_id, MIN(locale) as first_locale
                            FROM ${facilityTranslations}
                            WHERE facility_id NOT IN (
                                SELECT facility_id 
                                FROM ${facilityTranslations} 
                                WHERE locale = 'en'
                            )
                            GROUP BY facility_id
                        ) first_trans ON ct2.facility_id = first_trans.facility_id 
                        AND ct2.locale = first_trans.first_locale
                    ) t`,
                    sql`t.facility_id = ${facilities.id}`
                )
                .orderBy(orderBy)
                .limit(pageSize)
                .offset(offset)

            const [{ count }] = await db
                .select({ count: sql`count(*)`.mapWith(Number) })
                .from(facilities)

            return {
                data,
                meta: {
                    page,
                    pageSize,
                    totalItems: count,
                    totalPages: Math.ceil(count / pageSize),
                },
            }
        },
        CACHE_TTL.PAGINATED_DATA
    )
}

export async function getFacility(id: string) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return null

    const data = await db.query.facilityTranslations.findFirst({
        where: eq(facilities.id, parseInt(id)),
        with: {
            facility: {
                columns: {
                    id: true,
                }
            },
        },
        columns: {
            name: true
        }
    })

    return data
}

export const editFacility = async (values: { name: string, id: number }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        await db.transaction(async (tx) => {
            await tx
                .update(facilities)
                .set({
                    updatedAt: sql`now()`
                })
                .where(eq(facilities.id, values.id))

            await tx
                .update(facilityTranslations)
                .set({
                    name: values.name,
                    updatedAt: sql`now()`
                })
                .where(and(
                    eq(facilityTranslations.facilityId, values.id),
                    eq(facilityTranslations.locale, 'en')
                ))
        })

        // Invalidate facility caches
        await invalidateFacilitiesCache()

        revalidatePath('/admin/amenities')
        return { success: true }

    } catch (error) {
        console.error('Error updating facility:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while updating facility'
        }
    }
}

export const createFacility = async (values: { name: string }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        const [newFacility] = await db
            .insert(facilities)
            .values({
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            })
            .returning({
                id: facilities.id
            })

        if (!newFacility?.id) {
            throw new Error("Failed to create facility")
        }

        await db.insert(facilityTranslations).values({
            facilityId: newFacility.id,
            locale: 'en',
            name: values.name,
            createdAt: sql`now()`,
            updatedAt: sql`now()`
        })

        // Invalidate facility caches
        await invalidateFacilitiesCache()

        revalidatePath('/admin/amenities')
        return { success: true }

    } catch (error) {
        console.error('Error creating facility:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while creating facility'
        }
    }
}

export async function deleteFacilities(ids: number[]) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        error: 'You are not authorized to perform this action',
    }

    await db.delete(facilities).where(inArray(facilities.id, ids))

    // Invalidate facility caches
    await invalidateFacilitiesCache()

    revalidatePath('/admin/amenities')
}