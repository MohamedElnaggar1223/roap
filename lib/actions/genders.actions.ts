'use server'

import { SQL, asc, eq, sql, inArray, and } from 'drizzle-orm'
import { db } from '@/db'
import { genders, genderTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { getImageUrl } from '../supabase-images'
import { revalidatePath } from 'next/cache'

export async function getPaginatedGenders(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(genders.id)
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
            id: genders.id,
            name: sql<string>`t.name`,
            locale: sql<string>`t.locale`,
        })
        .from(genders)
        .innerJoin(
            sql`(
                SELECT ct.gender_id, ct.name, ct.locale
                FROM ${genderTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct2.gender_id, ct2.name, ct2.locale
                FROM ${genderTranslations} ct2
                INNER JOIN (
                    SELECT gender_id, MIN(locale) as first_locale
                    FROM ${genderTranslations}
                    WHERE gender_id NOT IN (
                        SELECT gender_id 
                        FROM ${genderTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY gender_id
                ) first_trans ON ct2.gender_id = first_trans.gender_id 
                AND ct2.locale = first_trans.first_locale
            ) t`,
            sql`t.gender_id = ${genders.id}`
        )
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(genders)

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

export async function getGender(id: string) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return null

    const data = await db.query.genderTranslations.findFirst({
        where: eq(genders.id, parseInt(id)),
        with: {
            gender: {
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

export const editGender = async (values: { name: string, id: number }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        await db.transaction(async (tx) => {
            await tx
                .update(genders)
                .set({
                    updatedAt: sql`now()`
                })
                .where(eq(genders.id, values.id))

            await tx
                .update(genderTranslations)
                .set({
                    name: values.name,
                    updatedAt: sql`now()`
                })
                .where(and(
                    eq(genderTranslations.genderId, values.id),
                    eq(genderTranslations.locale, 'en')
                ))
        })

        revalidatePath('/admin/amenities')
        return { success: true }

    } catch (error) {
        console.error('Error updating gender:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while updating gender'
        }
    }
}

export const createGender = async (values: { name: string }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        const [newGender] = await db
            .insert(genders)
            .values({
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            })
            .returning({
                id: genders.id
            })

        if (!newGender?.id) {
            throw new Error("Failed to create gender")
        }

        await db.insert(genderTranslations).values({
            genderId: newGender.id,
            locale: 'en',
            name: values.name,
            createdAt: sql`now()`,
            updatedAt: sql`now()`
        })

        revalidatePath('/admin/amenities')
        return { success: true }

    } catch (error) {
        console.error('Error creating gender:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while creating gender'
        }
    }
}

export async function deleteGenders(ids: number[]) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        error: 'You are not authorized to perform this action',
    }

    await db.delete(genders).where(inArray(genders.id, ids))

    revalidatePath('/admin/amenities')
}

export async function getAllGenders() {
    const data = await db
        .select({
            id: genders.id,
            name: sql<string>`t.name`,
            locale: sql<string>`t.locale`,
        })
        .from(genders)
        .innerJoin(
            sql`(
                SELECT ct.gender_id, ct.name, ct.locale
                FROM ${genderTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct2.gender_id, ct2.name, ct2.locale
                FROM ${genderTranslations} ct2
                INNER JOIN (
                    SELECT gender_id, MIN(locale) as first_locale
                    FROM ${genderTranslations}
                    WHERE gender_id NOT IN (
                        SELECT gender_id 
                        FROM ${genderTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY gender_id
                ) first_trans ON ct2.gender_id = first_trans.gender_id 
                AND ct2.locale = first_trans.first_locale
            ) t`,
            sql`t.gender_id = ${genders.id}`
        )
        .orderBy(asc(genders.id))

    return data
}