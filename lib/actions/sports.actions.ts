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
    }

    return withPaginatedCache(
        CACHE_KEYS.PAGINATED_SPORTS(page, pageSize, orderBy.toString()),
        async () => {
            const offset = (page - 1) * pageSize

            const [data, countResult] = await Promise.all([
                db
                    .select({
                        id: sports.id,
                        name: sportTranslations.name,
                        slug: sports.slug,
                        image: sports.image,
                        createdAt: sports.createdAt,
                        updatedAt: sports.updatedAt,
                    })
                    .from(sports)
                    .innerJoin(
                        sportTranslations,
                        and(
                            eq(sportTranslations.sportId, sports.id),
                            eq(sportTranslations.locale, 'en')
                        )
                    )
                    .limit(pageSize)
                    .offset(offset)
                    .orderBy(orderBy),

                db
                    .select({ count: sql<number>`count(*)` })
                    .from(sports)
                    .then(result => result[0]?.count || 0),
            ])

            const formattedData = data.map((sport: {
                id: number;
                name: string;
                slug: string | null;
                image: string | null;
                createdAt: string | null;
                updatedAt: string | null;
            }) => ({
                ...sport,
                image: getImageUrl(sport.image),
            }))

            return {
                data: formattedData,
                pagination: {
                    page,
                    pageSize,
                    total: countResult,
                    totalPages: Math.ceil(countResult / pageSize),
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
                name: sportTranslations.name,
                slug: sports.slug,
                image: sports.image,
            })
            .from(sports)
            .innerJoin(
                sportTranslations,
                and(
                    eq(sportTranslations.sportId, sports.id),
                    eq(sportTranslations.locale, 'en')
                )
            )
            .orderBy(asc(sportTranslations.name))

        const dataWithImages = data.map((sport: {
            id: number;
            name: string;
            slug: string | null;
            image: string | null;
        }) => ({
            ...sport,
            image: getImageUrl(sport.image),
        }))

        return dataWithImages
    }, CACHE_TTL.STATIC_DATA)
}