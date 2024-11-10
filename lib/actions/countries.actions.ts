'use server'

import { SQL, asc, eq, sql, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { countries, countryTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { z } from 'zod'
import { addCountrySchema, addCountryTranslationSchema } from '../validations/countries'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'

export async function getPaginatedCountries(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(countries.id)
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
            id: countries.id,
            name: countryTranslations.name,
            locale: countryTranslations.locale,
        })
        .from(countries)
        .leftJoin(countryTranslations, eq(countries.id, countryTranslations.countryId))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(countries)

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

export const addCountry = async (data: z.infer<typeof addCountrySchema>) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    const { name, locale } = data

    const countryCreated = await db.insert(countries).values({
        id: sql`DEFAULT`
    }).$returningId()

    if (!countryCreated || !countryCreated.length) return {
        data: null,
        error: 'Something went wrong',
    }

    await db.insert(countryTranslations).values({
        countryId: countryCreated[0]?.id,
        locale,
        name,
    })

    revalidatePath('/admin/countries')
}

export const getCountryTranslations = cache(async (id: string) => {
    const data = await db.select({
        id: countryTranslations.id,
        name: countryTranslations.name,
        locale: countryTranslations.locale,
    })
        .from(countryTranslations)
        .where(eq(countryTranslations.countryId, parseInt(id)))

    return data
})

export const deleteCountries = cache(async (ids: number[]) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(countries).where(inArray(countries.id, ids))

    revalidatePath('/admin/countries')
})

export const deleteCountryTranslations = cache(async (ids: number[]) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(countryTranslations).where(inArray(countryTranslations.id, ids))

    revalidatePath('/admin/countries')
})

export const addCountryTranslation = cache(async (data: z.infer<typeof addCountryTranslationSchema>) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            data: null,
            error: 'You are not authorized to perform this action',
        }

        const { name, locale, countryId } = data

        const countryTranslationCreated = await db.insert(countryTranslations).values({
            id: sql`DEFAULT`,
            countryId: parseInt(countryId),
            locale,
            name,
        }).$returningId()

        if (!countryTranslationCreated || !countryTranslationCreated.length) return {
            data: null,
            error: 'Something went wrong',
        }

        revalidatePath('/admin/countries')
    }
    catch (error: any) {
        return {
            data: null,
            error: error.message,
        }
    }
})