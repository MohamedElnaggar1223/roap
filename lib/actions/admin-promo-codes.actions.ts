'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { promoCodes, academics, academicTranslations } from '@/db/schema'
import { eq, sql, inArray, asc, or, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '../admin'
import { formatDateForDB } from '../utils'

export async function getPaginatedPromoCodesAdmin(
    page: number = 1,
    pageSize: number = 10
) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) {
        return {
            data: [],
            meta: {
                page: 1,
                pageSize: 10,
                totalItems: 0,
                totalPages: 0,
            },
        }
    }

    const offset = (page - 1) * pageSize

    const data = await db
        .select({
            id: promoCodes.id,
            code: promoCodes.code,
            discountType: promoCodes.discountType,
            discountValue: promoCodes.discountValue,
            startDate: promoCodes.startDate,
            endDate: promoCodes.endDate,
            canBeUsed: promoCodes.canBeUsed,
            academicId: promoCodes.academicId,
            academyName: sql<string>`coalesce(t.name, 'General (All Academies)')`,
            createdAt: promoCodes.createdAt,
        })
        .from(promoCodes)
        .leftJoin(academics, eq(promoCodes.academicId, academics.id))
        .leftJoin(
            sql`(
                SELECT at.academic_id, at.name
                FROM ${academicTranslations} at
                WHERE at.locale = 'en'
                UNION
                SELECT at.academic_id, at.name
                FROM ${academicTranslations} at
                WHERE at.academic_id NOT IN (
                    SELECT academic_id 
                    FROM ${academicTranslations} 
                    WHERE locale = 'en'
                )
                AND at.locale = (
                    SELECT MIN(locale) 
                    FROM ${academicTranslations} at2 
                    WHERE at2.academic_id = at.academic_id
                )
            ) t`,
            sql`t.academic_id = ${academics.id}`
        )
        .orderBy(asc(promoCodes.createdAt))
        .limit(pageSize)
        .offset(offset)

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(promoCodes)

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

export async function getPromoCodeAdmin(id: string) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return null

    const data = await db
        .select({
            id: promoCodes.id,
            code: promoCodes.code,
            discountType: promoCodes.discountType,
            discountValue: promoCodes.discountValue,
            startDate: promoCodes.startDate,
            endDate: promoCodes.endDate,
            canBeUsed: promoCodes.canBeUsed,
            academicId: promoCodes.academicId,
        })
        .from(promoCodes)
        .where(eq(promoCodes.id, parseInt(id)))
        .limit(1)

    return data[0] || null
}

export async function getAllAcademiesForSelect() {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) return []

    const data = await db
        .select({
            id: academics.id,
            name: sql<string>`t.name`,
        })
        .from(academics)
        .innerJoin(
            sql`(
                SELECT at.academic_id, at.name
                FROM ${academicTranslations} at
                WHERE at.locale = 'en'
                UNION
                SELECT at.academic_id, at.name
                FROM ${academicTranslations} at
                WHERE at.academic_id NOT IN (
                    SELECT academic_id 
                    FROM ${academicTranslations} 
                    WHERE locale = 'en'
                )
                AND at.locale = (
                    SELECT MIN(locale) 
                    FROM ${academicTranslations} at2 
                    WHERE at2.academic_id = at.academic_id
                )
            ) t`,
            sql`t.academic_id = ${academics.id}`
        )
        .where(eq(academics.status, 'accepted'))
        .orderBy(sql`t.name`)

    return data
}

export async function createPromoCodeAdmin(data: {
    code: string
    discountType: string
    discountValue: number
    startDate: Date
    endDate: Date
    canBeUsed: number
    academicId: number | null // null for general promo codes
}) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) {
        return { error: 'You are not authorized to perform this action' }
    }

    if (data.startDate > data.endDate) {
        return { error: 'Start date must be before end date', field: 'startDate' }
    }

    if (!promoCodes.discountType.enumValues.includes(data.discountType as 'fixed' | 'percentage')) {
        return { error: 'Discount type must be either fixed or percentage', field: 'discountType' }
    }

    try {
        // Check if code already exists for the same academy (or null for general)
        const existingPromoCode = await db
            .select({ id: promoCodes.id })
            .from(promoCodes)
            .where(
                and(
                    eq(promoCodes.code, data.code),
                    data.academicId
                        ? eq(promoCodes.academicId, data.academicId)
                        : isNull(promoCodes.academicId)
                )
            )
            .limit(1)

        if (existingPromoCode.length > 0) {
            return {
                error: data.academicId
                    ? 'A promo code with this code already exists for this academy'
                    : 'A general promo code with this code already exists',
                field: 'code'
            }
        }

        const [newPromoCode] = await db
            .insert(promoCodes)
            .values({
                code: data.code,
                discountType: data.discountType as 'fixed' | 'percentage',
                discountValue: data.discountValue,
                startDate: formatDateForDB(data.startDate),
                endDate: formatDateForDB(data.endDate),
                canBeUsed: data.canBeUsed,
                academicId: data.academicId,
                createdAt: sql`now()`,
                updatedAt: sql`now()`,
            })
            .returning({ id: promoCodes.id })

        revalidatePath('/admin/promo-codes')
        return { success: true, data: newPromoCode }

    } catch (error) {
        console.error('Error creating promo code:', error)
        return { error: 'Failed to create promo code', field: 'root' }
    }
}

export async function updatePromoCodeAdmin(id: number, data: {
    code: string
    discountType: string
    discountValue: number
    startDate: Date
    endDate: Date
    canBeUsed: number
    academicId: number | null
}) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) {
        return { error: 'You are not authorized to perform this action' }
    }

    if (data.startDate > data.endDate) {
        return { error: 'Start date must be before end date', field: 'startDate' }
    }

    if (!promoCodes.discountType.enumValues.includes(data.discountType as 'fixed' | 'percentage')) {
        return { error: 'Discount type must be either fixed or percentage', field: 'discountType' }
    }

    try {
        // Check if code already exists for the same academy (excluding current record)
        const existingPromoCode = await db
            .select({ id: promoCodes.id })
            .from(promoCodes)
            .where(
                and(
                    eq(promoCodes.code, data.code),
                    data.academicId
                        ? eq(promoCodes.academicId, data.academicId)
                        : isNull(promoCodes.academicId),
                    sql`${promoCodes.id} != ${id}`
                )
            )
            .limit(1)

        if (existingPromoCode.length > 0) {
            return {
                error: data.academicId
                    ? 'A promo code with this code already exists for this academy'
                    : 'A general promo code with this code already exists',
                field: 'code'
            }
        }

        await db
            .update(promoCodes)
            .set({
                code: data.code,
                discountType: data.discountType as 'fixed' | 'percentage',
                discountValue: data.discountValue,
                startDate: formatDateForDB(data.startDate),
                endDate: formatDateForDB(data.endDate),
                canBeUsed: data.canBeUsed,
                academicId: data.academicId,
                updatedAt: sql`now()`,
            })
            .where(eq(promoCodes.id, id))

        revalidatePath('/admin/promo-codes')
        return { success: true }

    } catch (error) {
        console.error('Error updating promo code:', error)
        return { error: 'Failed to update promo code', field: 'root' }
    }
}

export async function deletePromoCodesAdmin(ids: number[]) {
    const isAdminRes = await isAdmin()

    if (!isAdminRes) {
        return { error: 'You are not authorized to perform this action' }
    }

    try {
        await db.delete(promoCodes).where(inArray(promoCodes.id, ids))
        revalidatePath('/admin/promo-codes')
        return { success: true }
    } catch (error) {
        console.error('Error deleting promo codes:', error)
        return { error: 'Failed to delete promo codes' }
    }
} 