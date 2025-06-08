'use server'
import { formatDateForDB } from './../utils';
import { auth } from '@/auth'
import { db } from '@/db'
import { promoCodes } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { unstable_cache, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers';

const getPromoCodesAction = async (academicId: number) => {
    return unstable_cache(async (academicId: number) => {
        const promoCodesData = await db
            .query
            .promoCodes
            .findMany({
                where: (promoCodesTable, { eq }) => eq(promoCodesTable.academicId, academicId),
                columns: {
                    id: true,
                    code: true,
                    discountType: true,
                    discountValue: true,
                    startDate: true,
                    endDate: true,
                    canBeUsed: true,
                },
                orderBy: (promoCodesTable, { asc }) => asc(promoCodesTable.createdAt),
            })
        return {
            data: promoCodesData,
            error: null
        }
    }, [`promoCodes-${academicId.toString()}`], { tags: [`promoCodes-${academicId.toString()}`], revalidate: 60 })(academicId)
}

export const getPromoCodes = async () => {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academic) {
        return { error: 'Academy not found', data: null }
    }

    const promoCodesData = await getPromoCodesAction(academic.id)

    return promoCodesData
}

export const createPromoCode = async (data: {
    code: string
    discountType: string
    discountValue: number
    startDate: Date
    endDate: Date
    canBeUsed: number
}) => {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) {
        return { error: 'Academy not found', data: null }
    }

    if (data.startDate > data.endDate) {
        return { error: 'Start date must be before end date', field: 'startDate' }
    }


    if (!promoCodes.discountType.enumValues.includes(data.discountType as 'fixed' | 'percentage')) {
        return { error: 'Discount type must be either fixed or percentage', field: 'discountType' }
    }

    try {
        return await db.transaction(async (tx) => {
            const [promoCode] = await tx
                .insert(promoCodes)
                .values({
                    code: data.code,
                    discountType: data.discountType as 'fixed' | 'percentage',
                    discountValue: data.discountValue,
                    startDate: formatDateForDB(data.startDate),
                    endDate: formatDateForDB(data.endDate),
                    canBeUsed: data.canBeUsed,
                    academicId: academy.id,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`,
                })
                .returning({
                    id: promoCodes.id,
                })

            return { data: promoCode, error: null }
        })
    } catch (error) {
        console.error('Error creating promo code:', error)
        return { error: 'Failed to create promo code', field: 'root' }
    }
    finally {
        revalidateTag(`promoCodes-${academy?.id}`)
    }
}

export const updatePromoCode = async (id: number, data: {
    code: string
    discountType: string
    discountValue: number
    startDate: Date
    endDate: Date
    canBeUsed: number
}) => {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) {
        return { error: 'Academy not found', data: null }
    }

    if (data.startDate > data.endDate) {
        return { error: 'Start date must be before end date', field: 'startDate' }
    }

    if (!promoCodes.discountType.enumValues.includes(data.discountType as 'fixed' | 'percentage')) {
        return { error: 'Discount type must be either fixed or percentage', field: 'discountType' }
    }

    try {
        await db.update(promoCodes)
            .set({
                code: data.code,
                discountType: data.discountType as 'fixed' | 'percentage',
                discountValue: data.discountValue,
                startDate: formatDateForDB(data.startDate),
                endDate: formatDateForDB(data.endDate),
                canBeUsed: data.canBeUsed,
                updatedAt: sql`now()`
            })
            .where(eq(promoCodes.id, id))

        return { success: true }

    } catch (error) {
        console.error('Error updating promo code:', error)
        return { error: 'Failed to update promo code', field: 'root' }
    }
    finally {
        revalidateTag(`promoCodes-${academy?.id}`)
    }
}

export const deletePromoCodes = async (ids: number[]) => {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    // Build the where condition based on user role and impersonation
    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    // If not admin and not academic, return error
    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) {
        return { error: 'Academy not found', data: null }
    }

    try {
        await Promise.all(ids.map(async id => await db.delete(promoCodes).where(eq(promoCodes.id, id))))

        revalidateTag(`promoCodes-${academy?.id}`)
        return { success: true }

    } catch (error) {
        console.error('Error deleting promo code:', error)
        return { error: 'Failed to delete promo code', field: 'root' }
    }
    finally {
        revalidateTag(`promoCodes-${academy?.id}`)
    }
}