'use server'

import { SQL, asc, eq, sql, inArray, and } from 'drizzle-orm'
import { db } from '@/db'
import { cities, cityTranslations, countries, countryTranslations, states, stateTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { z } from 'zod'
import { addStateSchema, addStateTranslationSchema } from '../validations/states'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

export async function getPaginatedStates(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(states.id)
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

    const offset = (page - 1) * pageSize

    const data = await db
        .select({
            id: states.id,
            name: sql<string>`t.name`,
            locale: sql<string>`t.locale`,
            countryName: sql<string>`ct.name`,
            countryLocale: sql<string>`ct.locale`
        })
        .from(states)
        .leftJoin(countries, eq(states.countryId, countries.id))
        .innerJoin(
            sql`(
                SELECT st.state_id, st.name, st.locale
                FROM ${stateTranslations} st
                WHERE st.locale = 'en'
                UNION
                SELECT st2.state_id, st2.name, st2.locale
                FROM ${stateTranslations} st2
                INNER JOIN (
                    SELECT state_id, MIN(locale) as first_locale
                    FROM ${stateTranslations}
                    WHERE state_id NOT IN (
                        SELECT state_id 
                        FROM ${stateTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY state_id
                ) first_trans ON st2.state_id = first_trans.state_id 
                AND st2.locale = first_trans.first_locale
            ) t`,
            sql`t.state_id = ${states.id}`
        )
        .innerJoin(
            sql`(
                SELECT ct.country_id, ct.name, ct.locale
                FROM ${countryTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct2.country_id, ct2.name, ct2.locale
                FROM ${countryTranslations} ct2
                INNER JOIN (
                    SELECT country_id, MIN(locale) as first_locale
                    FROM ${countryTranslations}
                    WHERE country_id NOT IN (
                        SELECT country_id 
                        FROM ${countryTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY country_id
                ) first_trans ON ct2.country_id = first_trans.country_id 
                AND ct2.locale = first_trans.first_locale
            ) ct`,
            sql`ct.country_id = ${states.countryId}`
        )
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(states)

    return {
        data,
        meta: {
            page,
            pageSize,
            totalItems: count,
            totalPages: Math.ceil(count / pageSize),
        },
    }
}

export const addState = async (data: z.infer<typeof addStateSchema>) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    const { name, locale, countryId } = data

    const stateCreated = await db.insert(states).values({
        countryId: parseInt(countryId),
    }).returning({
        id: states.id
    })

    if (!stateCreated || !stateCreated.length) return {
        data: null,
        error: 'Something went wrong',
    }

    await db.insert(stateTranslations).values({
        stateId: stateCreated[0]?.id,
        locale,
        name,
    })

    revalidatePath('/admin/states')
}

export const getStateTranslations = cache(async (id: string) => {
    const data = await db.select({
        id: stateTranslations.id,
        name: stateTranslations.name,
        locale: stateTranslations.locale,
        countryId: states.countryId,
    })
        .from(stateTranslations)
        .where(eq(stateTranslations.stateId, parseInt(id)))
        .leftJoin(states, eq(stateTranslations.stateId, states.id))

    return data
})

export const deleteStates = async (ids: number[]) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(states).where(inArray(states.id, ids))

    revalidatePath('/admin/states')
}

export const deleteStateTranslations = async (ids: number[], stateId: string) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(stateTranslations).where(inArray(stateTranslations.id, ids))

    revalidatePath(`/admin/states/${stateId}/edit`)
}

export const addStateTranslation = async (data: z.infer<typeof addStateTranslationSchema>) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            data: null,
            error: 'You are not authorized to perform this action',
        }

        const { name, locale, stateId } = data

        const stateTranslationCreated = await db.insert(stateTranslations).values({
            stateId: parseInt(stateId),
            locale,
            name,
            createdAt: sql`now()`,
            updatedAt: sql`now()`,
        }).returning({
            id: stateTranslations.id
        })

        if (!stateTranslationCreated || !stateTranslationCreated.length) return {
            data: null,
            error: 'Something went wrong',
        }

        revalidatePath(`/admin/states/${stateId}/edit`)

        return {
            data: stateTranslationCreated[0]?.id,
            error: null,
        }
    }
    catch (error: any) {
        return {
            data: null,
            error: error.message,
        }
    }
}

export const editStateTranslation = async (data: { name: string, locale: string, countryId?: string }, id: number, stateId?: string) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            data: null,
            error: 'You are not authorized to perform this action',
        }

        const { name, locale } = data

        if (!data?.countryId || !stateId) {
            await db.update(stateTranslations).set({
                name,
                locale,
                updatedAt: sql`now()`,
            }).where(eq(stateTranslations.id, id))
        }
        else {
            await Promise.all([
                db.update(states).set({
                    countryId: parseInt(data.countryId),
                    updatedAt: sql`now()`,
                }).where(eq(states.id, parseInt(stateId))),
                db.update(stateTranslations).set({
                    name,
                    locale,
                    updatedAt: sql`now()`,
                }).where(eq(stateTranslations.id, id))
            ])
        }

        revalidatePath(`/admin/states/${id}/edit`)

        return {
            data: id,
            error: null,
        }
    }
    catch (error: any) {
        return {
            data: null,
            error: error.message,
        }
    }
}

export const deleteState = async (id: number) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(states).where(eq(states.id, id))

    revalidatePath('/admin/states')
}

export const getCitiesByState = async (id: string) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    const data = await db
        .select({
            id: cities.id,
            name: sql<string>`t.name`,
            translationId: sql<number>`t.id`,
            locale: sql<string>`t.locale`,
        })
        .from(cities)
        .innerJoin(
            sql`(
                SELECT ct.city_id, ct.name, ct.id, ct.locale
                FROM ${cityTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct2.city_id, ct2.name, ct2.id, ct2.locale
                FROM ${cityTranslations} ct2
                INNER JOIN (
                    SELECT city_id, MIN(locale) as first_locale
                    FROM ${cityTranslations}
                    WHERE city_id NOT IN (
                        SELECT city_id 
                        FROM ${cityTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY city_id
                ) first_trans ON ct2.city_id = first_trans.city_id 
                AND ct2.locale = first_trans.first_locale
            ) t`,
            sql`t.city_id = ${cities.id}`
        )
        .where(eq(cities.stateId, parseInt(id)))

    return {
        data,
        error: null,
    }
}

export const getAllStates = async () => {
    const AdminRes = await isAdmin()

    if (!AdminRes) return {
        data: [],
        error: 'You are not authorized to perform this action',
    }

    const data = await db.select({
        id: states.id,
        name: stateTranslations.name,
        locale: stateTranslations.locale,
        translationId: stateTranslations.id,
    })
        .from(states)
        .leftJoin(stateTranslations, eq(stateTranslations.stateId, states.id))


    const finalData = data.reduce((acc, curr) => {
        const existingState = acc.find(state => state.id === curr.id);

        if (existingState) {
            existingState.stateTranslations.push({
                id: curr.translationId ?? 0,
                name: curr.name ?? '',
                locale: curr.locale ?? '',
            });
        } else {
            acc.push({
                id: curr.id,
                stateTranslations: [{
                    id: curr.translationId ?? 0,
                    name: curr.name ?? '',
                    locale: curr.locale ?? '',
                }]
            });
        }

        return acc;
    }, [] as { id: number; stateTranslations: { id: number; name: string; locale: string; }[] }[]);

    return {
        data: finalData,
        error: null,
    }
}

export const editCityTranslation = async (data: { name: string }, id: number) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.update(cityTranslations).set({
        name: data.name,
        updatedAt: sql`now()`,
    }).where(eq(cityTranslations.id, id))

    revalidatePath(`/admin/states`)

    return {
        data: id,
        error: null,
    }
}