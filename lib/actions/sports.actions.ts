'use server'

import { SQL, asc, eq, sql, inArray, and } from 'drizzle-orm'
import { db } from '@/db'
import { sports, sportTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { getImageUrl } from '../supabase-images'
import { revalidatePath } from 'next/cache'
import { slugify } from '../utils'
import { withCache, withPaginatedCache } from '@/lib/cache/wrapper'
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache/keys'
import {
    invalidateAllSportRelatedData,
    invalidateAndRefreshAllSports,
    invalidateAndRefreshSport,
    smartInvalidateSports
} from '@/lib/cache/invalidation'

export async function getPaginatedSports(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(sports.id)
) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        error: 'You are not authorized to perform this action',
        data: [],
        meta: {
            page: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
        },
    }

    return withPaginatedCache(
        CACHE_KEYS.PAGINATED_SPORTS(page, pageSize, orderBy.toString()),
        async () => {
            const offset = (page - 1) * pageSize

            const data = await db
                .select({
                    id: sports.id,
                    name: sql<string>`t.name`,
                    locale: sql<string>`t.locale`,
                    image: sports.image,
                })
                .from(sports)
                .innerJoin(
                    sql`(
                        SELECT ct.sport_id, ct.name, ct.locale
                        FROM ${sportTranslations} ct
                        WHERE ct.locale = 'en'
                        UNION
                        SELECT ct2.sport_id, ct2.name, ct2.locale
                        FROM ${sportTranslations} ct2
                        INNER JOIN (
                            SELECT sport_id, MIN(locale) as first_locale
                            FROM ${sportTranslations}
                            WHERE sport_id NOT IN (
                                SELECT sport_id 
                                FROM ${sportTranslations} 
                                WHERE locale = 'en'
                            )
                            GROUP BY sport_id
                        ) first_trans ON ct2.sport_id = first_trans.sport_id 
                        AND ct2.locale = first_trans.first_locale
                    ) t`,
                    sql`t.sport_id = ${sports.id}`
                )
                .orderBy(orderBy)
                .limit(pageSize)
                .offset(offset)

            const [{ count }] = await db
                .select({ count: sql`count(*)`.mapWith(Number) })
                .from(sports)

            const dataWithImages = await Promise.all(
                data.map(async (sport: {
                    id: number;
                    name: string;
                    locale: string;
                    image: string | null;
                }) => {
                    const image = await getImageUrl(sport.image)
                    return { ...sport, image }
                })
            )

            return {
                data: dataWithImages,
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

export async function getSport(id: string) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return null

    const cacheKey = `sport:${id}:details`

    return withCache(cacheKey, async () => {
        const data = await db.query.sportTranslations.findFirst({
            where: eq(sports.id, parseInt(id)),
            with: {
                sport: {
                    columns: {
                        image: true,
                        id: true,
                    }
                },
            },
            columns: {
                name: true
            }
        })

        const image = await getImageUrl(data?.sport?.image ?? '')

        return {
            ...data,
            image,
        }
    })
}

export const editSport = async (values: { name: string, image: string | null, id: number }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        await db.transaction(async (tx) => {
            await tx
                .update(sports)
                .set({
                    image: values.image?.includes('images/') ?
                        values.image?.startsWith('images/') ?
                            values.image :
                            'images/' + values.image?.split('images/')[1] :
                        'images/' + values.image,
                    updatedAt: sql`now()`
                })
                .where(eq(sports.id, values.id))

            await tx
                .update(sportTranslations)
                .set({
                    name: values.name,
                    updatedAt: sql`now()`
                })
                .where(and(
                    eq(sportTranslations.sportId, values.id),
                    eq(sportTranslations.locale, 'en')
                ))
        })

        await invalidateAllSportRelatedData()

        revalidatePath('/admin/sports')
        return { success: true }

    } catch (error) {
        console.error('Error updating sport:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while updating sport'
        }
    }
}

export const createSport = async (values: { name: string, image: string | null }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        const slug = slugify(values.name)

        const [newSport] = await db
            .insert(sports)
            .values({
                slug,
                image: values.image?.includes('images/') ?
                    values.image?.startsWith('images/') ?
                        values.image :
                        'images/' + values.image?.split('images/')[1] :
                    'images/' + values.image,
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            })
            .returning({
                id: sports.id
            })

        if (!newSport?.id) {
            throw new Error("Failed to create sport")
        }

        await db.insert(sportTranslations).values({
            sportId: newSport.id,
            locale: 'en',
            name: values.name,
            createdAt: sql`now()`,
            updatedAt: sql`now()`
        })

        await invalidateAllSportRelatedData()

        revalidatePath('/admin/sports')
        return { success: true }

    } catch (error) {
        console.error('Error creating sport:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while creating sport'
        }
    }
}

export async function deleteSports(ids: number[]) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        error: 'You are not authorized to perform this action',
    }

    await db.delete(sports).where(inArray(sports.id, ids))

    await invalidateAllSportRelatedData()

    revalidatePath('/admin/sports')
}

export async function getAllSports() {
    return withCache(CACHE_KEYS.ALL_SPORTS, async () => {
        const data = await db
            .select({
                id: sports.id,
                name: sql<string>`t.name`,
                slug: sports.slug,
                image: sports.image,
            })
            .from(sports)
            .innerJoin(
                sql`(
                    SELECT ct.sport_id, ct.name
                    FROM ${sportTranslations} ct
                    WHERE ct.locale = 'en'
                    UNION
                    SELECT ct2.sport_id, ct2.name
                    FROM ${sportTranslations} ct2
                    INNER JOIN (
                        SELECT sport_id, MIN(locale) as first_locale
                        FROM ${sportTranslations}
                        WHERE sport_id NOT IN (
                            SELECT sport_id 
                            FROM ${sportTranslations} 
                            WHERE locale = 'en'
                        )
                        GROUP BY sport_id
                    ) first_trans ON ct2.sport_id = first_trans.sport_id 
                    AND ct2.locale = first_trans.first_locale
                ) t`,
                sql`t.sport_id = ${sports.id}`
            )
            .orderBy(asc(sql`t.name`))

        const dataWithImages = await Promise.all(
            data.map(async (sport: {
                id: number;
                name: string;
                slug: string | null;
                image: string | null;
            }) => {
                const image = await getImageUrl(sport.image)
                return { ...sport, image }
            })
        )

        return dataWithImages
    }, CACHE_TTL.STATIC_DATA)
}