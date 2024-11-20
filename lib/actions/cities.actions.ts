'use server'

import { SQL, asc, eq, sql, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { cities, cityTranslations, states, stateTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { z } from 'zod'
import { addCitySchema, addCityTranslationSchema } from '../validations/cities'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

export async function getPaginatedCities(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(cities.id)
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
            id: cities.id,
            name: sql<string>`t.name`,
            locale: sql<string>`t.locale`,
            state: sql<string>`st.name`,
            stateLocale: sql<string>`st.locale`,
        })
        .from(cities)
        .leftJoin(states, eq(cities.stateId, states.id))
        .innerJoin(
            sql`(
                SELECT ct.city_id, ct.name, ct.locale
                FROM ${cityTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct2.city_id, ct2.name, ct2.locale
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
            ) st`,
            sql`st.state_id = ${cities.stateId}`
        )
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(cities)

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

export const addCity = async (data: z.infer<typeof addCitySchema>) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    const { name, locale, stateId } = data

    const cityCreated = await db.insert(cities).values({
        stateId: parseInt(stateId),
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
    }).returning({
        id: cities.id
    })

    if (!cityCreated || !cityCreated.length) return {
        data: null,
        error: 'Something went wrong',
    }

    await db.insert(cityTranslations).values({
        cityId: cityCreated[0]?.id,
        locale,
        name,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
    })

    revalidatePath('/admin/cities')
}

export const getCityTranslations = cache(async (id: string) => {
    const data = await db.select({
        id: cityTranslations.id,
        name: cityTranslations.name,
        locale: cityTranslations.locale,
        stateId: cities.stateId,
    })
        .from(cityTranslations)
        .where(eq(cityTranslations.cityId, parseInt(id)))
        .leftJoin(cities, eq(cities.id, cityTranslations.cityId))

    return data
})

export const deleteCities = async (ids: number[]) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(cities).where(inArray(cities.id, ids))

    revalidatePath('/admin/cities')
}

export const deleteCityTranslations = async (ids: number[], cityId: string) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(cityTranslations).where(inArray(cityTranslations.id, ids))

    revalidatePath(`/admin/cities/${cityId}/edit`)
}

export const addCityTranslation = async (data: z.infer<typeof addCityTranslationSchema>) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            data: null,
            error: 'You are not authorized to perform this action',
        }

        const { name, locale, cityId } = data

        const cityTranslationCreated = await db.insert(cityTranslations).values({
            cityId: parseInt(cityId),
            locale,
            name,
            createdAt: sql`now()`,
            updatedAt: sql`now()`,
        }).returning({
            id: cityTranslations.id
        })

        if (!cityTranslationCreated || !cityTranslationCreated.length) return {
            data: null,
            error: 'Something went wrong',
        }

        revalidatePath(`/admin/cities/${cityId}/edit`)

        return {
            data: cityTranslationCreated[0]?.id,
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

export const editCityTranslation = async (data: { name: string, locale: string, stateId?: string }, id: number, cityId?: string) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            data: null,
            error: 'You are not authorized to perform this action',
        }

        const { name, locale } = data

        if (!data?.stateId || !cityId) {
            await db.update(cityTranslations).set({
                name,
                locale,
                updatedAt: sql`now()`,
            }).where(eq(cityTranslations.id, id))
        }
        else {
            await Promise.all([
                db.update(cities).set({
                    stateId: parseInt(data.stateId),
                    updatedAt: sql`now()`,
                }).where(eq(cities.id, parseInt(cityId))),
                db.update(cityTranslations).set({
                    name,
                    locale,
                    updatedAt: sql`now()`,
                }).where(eq(cityTranslations.id, id))
            ])
        }

        revalidatePath(`/admin/cities/${id}/edit`)

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

export const deleteCity = async (id: number) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(cities).where(eq(cities.id, id))

    revalidatePath('/admin/cities')
}