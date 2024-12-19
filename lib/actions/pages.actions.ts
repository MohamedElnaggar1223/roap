'use server'

import { SQL, asc, eq, sql, inArray, and } from 'drizzle-orm'
import { db } from '@/db'
import { pages, pageTranslations } from '@/db/schema'
import { isAdmin } from '../admin'
import { getImageUrl } from '../supabase-images'
import { revalidatePath } from 'next/cache'

export async function getPaginatedPages(
    page: number = 1,
    pageSize: number = 10,
    orderBy: SQL = asc(pages.id)
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
            id: pages.id,
            title: sql<string>`SUBSTRING(t.title, 1, 50)`,
            locale: sql<string>`t.locale`,
            image: pages.image,
            orderBy: pages.orderBy,
        })
        .from(pages)
        .innerJoin(
            sql`(
                SELECT ct.page_id, ct.title, ct.locale
                FROM ${pageTranslations} ct
                WHERE ct.locale = 'en'
                UNION
                SELECT ct2.page_id, ct2.title, ct2.locale
                FROM ${pageTranslations} ct2
                INNER JOIN (
                    SELECT page_id, MIN(locale) as first_locale
                    FROM ${pageTranslations}
                    WHERE page_id NOT IN (
                        SELECT page_id 
                        FROM ${pageTranslations} 
                        WHERE locale = 'en'
                    )
                    GROUP BY page_id
                ) first_trans ON ct2.page_id = first_trans.page_id 
                AND ct2.locale = first_trans.first_locale
            ) t`,
            sql`t.page_id = ${pages.id}`
        )
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(pages)

    const dataWithImages = await Promise.all(
        data.map(async (page) => {
            const image = await getImageUrl(page.image)
            return { ...page, image }
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

export async function getPage(id: string) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return null

    const data = await db.query.pageTranslations.findFirst({
        where: eq(pages.id, parseInt(id)),
        with: {
            page: {
                columns: {
                    image: true,
                    id: true,
                    orderBy: true
                }
            },
        },
        columns: {
            content: true,
            title: true,
        }
    })

    const image = await getImageUrl(data?.page?.image ?? '')

    return {
        ...data,
        image,
    }
}

export const editPage = async (values: { content: string, image: string | null, id: number, orderBy: string, title: string }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        await db.transaction(async (tx) => {
            await tx
                .update(pages)
                .set({
                    image: values.image?.includes('images/') ?
                        values.image?.startsWith('images/') ?
                            values.image :
                            'images/' + values.image?.split('images/')[1] :
                        'images/' + values.image,
                    orderBy: values.orderBy,
                    updatedAt: sql`now()`
                })
                .where(eq(pages.id, values.id))

            await tx
                .update(pageTranslations)
                .set({
                    content: values.content,
                    title: values.title,
                    updatedAt: sql`now()`
                })
                .where(and(
                    eq(pageTranslations.pageId, values.id),
                    eq(pageTranslations.locale, 'en')
                ))
        })

        revalidatePath('/admin/pages')
        return { success: true }

    } catch (error) {
        console.error('Error updating page:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while updating page'
        }
    }
}

export const createPage = async (values: { content: string, image: string | null, orderBy: string }) => {
    try {
        const isAdminRes = await isAdmin()

        if (!isAdminRes) return {
            error: 'You are not authorized to perform this action',
        }

        const [newPage] = await db
            .insert(pages)
            .values({
                image: values.image?.includes('images/') ?
                    values.image?.startsWith('images/') ?
                        values.image :
                        'images/' + values.image?.split('images/')[1] :
                    'images/' + values.image,
                orderBy: values.orderBy,
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            })
            .returning({
                id: pages.id
            })

        if (!newPage?.id) {
            throw new Error("Failed to create page")
        }

        await db.insert(pageTranslations).values({
            pageId: newPage.id,
            locale: 'en',
            content: values.content,
            createdAt: sql`now()`,
            updatedAt: sql`now()`
        })

        revalidatePath('/admin/pages')
        return { success: true }

    } catch (error) {
        console.error('Error creating page:', error)

        if (error instanceof Error) {
            return {
                error: error.message
            }
        }

        return {
            error: 'Something went wrong while creating page'
        }
    }
}

export async function deletePages(ids: number[]) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return {
        error: 'You are not authorized to perform this action',
    }

    await db.delete(pages).where(inArray(pages.id, ids))

    revalidatePath('/admin/pages')
}