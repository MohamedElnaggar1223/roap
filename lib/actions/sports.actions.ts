'use server'

import { SQL, asc, eq, sql, inArray, and } from 'drizzle-orm'
import { db } from '@/db'
import { sports, sportTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { getImageUrl } from '../supabase-images'
import { revalidatePath } from 'next/cache'
import { slugify } from '../utils'
import { getFromCache, setToCache, generateCacheKey, updateCachedItem, clearCache } from '@/lib/cache.utils';
import { redis } from '@/lib/redis';

// Helper function to create a somewhat stable string from orderBy SQL object
const serializeOrderBy = (orderBy: SQL): string => {
    // This is a basic approach. For complex SQL objects, a more structured
    // serialization might be needed. If orderBy options are limited and known,
    // mapping them to specific strings would be most robust.
    return String(orderBy).replace(/\s+/g, '_'); // Replace spaces for a cleaner key part
};

export async function getPaginatedSports(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(sports.id)
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

    const versionKey = generateCacheKey('cache', 'version', 'sports', 'paginated');
    let currentVersion = await redis.get<string>(versionKey);
    if (currentVersion === null) {
        currentVersion = '1'; // Default to version 1 if not set
        // Optionally, set it in Redis if it's the first time, though incr will create it too
        // await redis.set(versionKey, currentVersion, { nx: true }); 
    }

    const cacheKey = generateCacheKey(
        'sports',
        'paginated',
        `v-${currentVersion}`,
        `page-${page}`,
        `size-${pageSize}`,
        `order-${serializeOrderBy(orderBy)}`
    );

    const cachedData = await getFromCache<Awaited<ReturnType<typeof getPaginatedSportsCoreLogic>>>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const result = await getPaginatedSportsCoreLogic(page, pageSize, orderBy);

    if (result && result.data.length > 0) { // Only cache if there's data
        await setToCache(cacheKey, result);
    }

    return result;
}

// Extracted core logic for getPaginatedSports
async function getPaginatedSportsCoreLogic(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(sports.id)
) {
    // Assuming isAdmin check is handled by the calling function (getPaginatedSports)
    const offset = (page - 1) * pageSize;

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
        data.map(async (sport) => {
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
}

export async function getSport(id: string) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return null

    const cacheKey = generateCacheKey('sport', id, 'details');
    const cachedSport = await getFromCache<Awaited<ReturnType<typeof getSportCoreLogic>>>(cacheKey);

    if (cachedSport) {
        return cachedSport;
    }

    const sportData = await getSportCoreLogic(id);

    if (sportData) {
        await setToCache(cacheKey, sportData);
    }

    return sportData;
}

// Extracted core logic for getSport to be reused by cache update mechanisms
async function getSportCoreLogic(id: string) {
    // Note: Original function did not explicitly check isAdmin again here,
    // assuming the caller (getSport) handles authorization.
    // If getSportCoreLogic could be called directly from an unauthorized context,
    // the isAdmin check might be needed here too. For now, following original pattern.

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
    });

    if (!data) return null; // Handle case where sport is not found

    const image = await getImageUrl(data?.sport?.image ?? '');

    return {
        ...data,
        image,
    };
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

        // Update the cache for the specific sport that was edited
        const cacheKey = generateCacheKey('sport', values.id, 'details');
        await updateCachedItem(cacheKey, () => getSportCoreLogic(String(values.id)));

        // Increment paginated sports version
        await redis.incr(generateCacheKey('cache', 'version', 'sports', 'paginated'));

        // Clear paginated sports caches as an edit might affect multiple pages
        // This is a broad approach. More granular updates are complex.
        // For now, we'll rely on revalidatePath and TTL for paginated views, 
        // but explicitly clear a known pattern if we had one or if the client supported it easily.
        // Example of what one might do if pattern deletion was simple (Upstash recommends against KEYS for performance):
        // const paginatedSportsPattern = generateCacheKey('sports', 'paginated', '*');
        // await clearCacheByPattern(paginatedSportsPattern); // Hypothetical function

        revalidatePath('/admin/sports') // This will help Next.js refetch data for list views
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

        // Increment paginated sports version
        await redis.incr(generateCacheKey('cache', 'version', 'sports', 'paginated'));

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

    // Before deleting from DB, prepare cache keys for the items being deleted
    const cacheKeysToClear: string[] = ids.map(id => generateCacheKey('sport', id, 'details'));

    await db.delete(sports).where(inArray(sports.id, ids))

    // Clear the cache for the deleted sports
    if (cacheKeysToClear.length > 0) {
        await clearCache(cacheKeysToClear);
    }

    // Increment paginated sports version
    await redis.incr(generateCacheKey('cache', 'version', 'sports', 'paginated'));

    // Revalidate path for list views
    revalidatePath('/admin/sports')
    // Return void or a success indicator if preferred by function signature
}