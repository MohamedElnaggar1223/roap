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
            name: sql<string>`t.name`,
            locale: sql<string>`t.locale`,
        })
        .from(countries)
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
            ) t`,
            sql`t.country_id = ${countries.id}`
        )
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

    console.log(data)

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
    }).returning({
        id: countries.id,
    })

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

export const deleteCountries = async (ids: number[]) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(countries).where(inArray(countries.id, ids))

    revalidatePath('/admin/countries')
}

export const deleteCountryTranslations = async (ids: number[], countryId: string) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(countryTranslations).where(inArray(countryTranslations.id, ids))

    revalidatePath(`/admin/countries/${countryId}/edit`)
}

export const addCountryTranslation = async (data: z.infer<typeof addCountryTranslationSchema>) => {
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
        }).returning({
            id: countryTranslations.id,
        })

        if (!countryTranslationCreated || !countryTranslationCreated.length) return {
            data: null,
            error: 'Something went wrong',
        }

        revalidatePath(`/admin/countries/${countryId}/edit`)

        return {
            data: countryTranslationCreated[0]?.id,
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

export const editCountryTranslation = async (data: { name: string, locale: string }, id: number) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            data: null,
            error: 'You are not authorized to perform this action',
        }

        const { name, locale } = data

        await db.update(countryTranslations).set({
            name,
            locale,
        }).where(eq(countryTranslations.id, id))

        revalidatePath(`/admin/countries/${id}/edit`)

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

export const deleteCountry = async (id: number) => {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        data: null,
        error: 'You are not authorized to perform this action',
    }

    await db.delete(countries).where(eq(countries.id, id))

    revalidatePath('/admin/countries')
}

export const getAllCountries = cache(async () => {
    const AdminRes = await isAdmin()

    if (!AdminRes) return {
        data: [],
        error: 'You are not authorized to perform this action',
    }

    const data = await db.select({
        id: countries.id,
        name: countryTranslations.name,
        locale: countryTranslations.locale,
        translationId: countryTranslations.id,
    })
        .from(countries)
        .leftJoin(countryTranslations, eq(countryTranslations.countryId, countries.id))


    const finalData = data.reduce((acc, curr) => {
        const existingCountry = acc.find(country => country.id === curr.id);

        if (existingCountry) {
            existingCountry.countryTranslations.push({
                id: curr.translationId ?? 0,
                name: curr.name ?? '',
                locale: curr.locale ?? '',
            });
        } else {
            acc.push({
                id: curr.id,
                countryTranslations: [{
                    id: curr.translationId ?? 0,
                    name: curr.name ?? '',
                    locale: curr.locale ?? '',
                }]
            });
        }

        return acc;
    }, [] as { id: number; countryTranslations: { id: number; name: string; locale: string; }[] }[]);

    return {
        data: finalData,
        error: null,
    }
})