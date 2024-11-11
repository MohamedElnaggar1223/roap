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
            state: sql<string>`
            COALESCE(
                (
                    SELECT ct.name 
                    FROM ${stateTranslations} as ct 
                    WHERE ct.state_id = ${cities.stateId} 
                    AND ct.locale = 'en' 
                    LIMIT 1
                ),
                (
                    SELECT ct.name 
                    FROM ${stateTranslations} as ct 
                    WHERE ct.state_id = ${cities.stateId}
                    LIMIT 1
                )
            )
        `

        })
        .from(cities)
        .leftJoin(states, eq(cities.stateId, states.id))
        .innerJoin(
            sql`(
                SELECT ct.city_id, ct.name, ct.locale
                FROM ${cityTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct.city_id, ct.name, ct.locale
                FROM ${cityTranslations} ct
                WHERE ct.city_id NOT IN (
                    SELECT city_id 
                    FROM ${cityTranslations} 
                    WHERE locale = 'en'
                )
            ) t`,
            sql`t.city_id = ${cities.id}`
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
        id: sql`DEFAULT`,
        stateId: parseInt(stateId),
    }).$returningId()

    if (!cityCreated || !cityCreated.length) return {
        data: null,
        error: 'Something went wrong',
    }

    await db.insert(cityTranslations).values({
        cityId: cityCreated[0]?.id,
        locale,
        name,
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
            id: sql`DEFAULT`,
            cityId: parseInt(cityId),
            locale,
            name,
        }).$returningId()

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
            }).where(eq(cityTranslations.id, id))
        }
        else {
            await Promise.all([
                db.update(cities).set({
                    stateId: parseInt(data.stateId),
                }).where(eq(cities.id, parseInt(cityId))),
                db.update(cityTranslations).set({
                    name,
                    locale,
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