'use server'

import { SQL, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cities, cityTranslations, states, stateTranslations } from '@/db/schema'
import { isAdmin } from '../admin'

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
            name: cityTranslations.name,
            state: stateTranslations.name,
        })
        .from(cities)
        .leftJoin(cityTranslations, eq(cities.id, cityTranslations.cityId))
        .leftJoin(states, eq(cities.stateId, states.id))
        .leftJoin(stateTranslations, eq(states.id, stateTranslations.stateId))
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

