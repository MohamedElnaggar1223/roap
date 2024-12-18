'use server'

import { and, eq, gte, lte } from "drizzle-orm"
import { db } from "@/db"
import { discounts, packageDiscount } from "@/db/schema"
import { revalidatePath } from "next/cache"

interface CreateDiscountParams {
    type: 'fixed' | 'percentage'
    value: number
    startDate: Date
    endDate: Date
    programId: number
    packageIds: number[]
}

export async function createDiscount({
    type,
    value,
    startDate,
    endDate,
    programId,
    packageIds
}: CreateDiscountParams) {
    try {
        if (value <= 0) {
            return { error: 'Discount value must be greater than 0' }
        }
        if (type === 'percentage' && value > 100) {
            return { error: 'Percentage discount cannot exceed 100%' }
        }
        if (startDate >= endDate) {
            return { error: 'Start date must be before end date' }
        }

        // Format dates for DB comparison
        const formattedStartDate = startDate.toISOString()
        const formattedEndDate = endDate.toISOString()

        const overlappingDiscounts = await db.query.discounts.findMany({
            where: and(
                eq(discounts.programId, programId),
                gte(discounts.endDate, formattedStartDate),
                lte(discounts.startDate, formattedEndDate)
            ),
            with: {
                packageDiscounts: {
                    with: {
                        package: true
                    }
                }
            }
        })

        const overlappingPackages = overlappingDiscounts.flatMap(discount =>
            discount.packageDiscounts.filter(pd =>
                packageIds.includes(pd.package.id)
            ).map(pd => pd.package.name)
        )

        if (overlappingPackages.length > 0) {
            return {
                error: `Some packages already have discounts in this date range: ${overlappingPackages.join(', ')}`
            }
        }

        // Create discount with formatted dates
        const [createdDiscount] = await db.insert(discounts)
            .values({
                type: type as any, // Type assertion needed due to enum
                value,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                programId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            .returning()

        // Create package discount associations with formatted dates
        if (packageIds.length > 0) {
            await db.insert(packageDiscount)
                .values(
                    packageIds.map(packageId => ({
                        packageId,
                        discountId: createdDiscount.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }))
                )
        }

        revalidatePath('/programs')
        return { success: true }

    } catch (error) {
        console.error('Error creating discount:', error)
        return { error: 'Failed to create discount' }
    }
}

interface UpdateDiscountParams {
    id: number
    type: 'fixed' | 'percentage'
    value: number
    startDate: Date
    endDate: Date
    packageIds: number[]
}

export async function updateDiscount({
    id,
    type,
    value,
    startDate,
    endDate,
    packageIds
}: UpdateDiscountParams) {
    try {
        if (value <= 0) {
            return { error: 'Discount value must be greater than 0' }
        }
        if (type === 'percentage' && value > 100) {
            return { error: 'Percentage discount cannot exceed 100%' }
        }
        if (startDate >= endDate) {
            return { error: 'Start date must be before end date' }
        }

        const currentDiscount = await db.query.discounts.findFirst({
            where: eq(discounts.id, id)
        })

        if (!currentDiscount) {
            return { error: 'Discount not found' }
        }

        // Format dates for DB comparison
        const formattedStartDate = startDate.toISOString()
        const formattedEndDate = endDate.toISOString()

        const overlappingDiscounts = await db.query.discounts.findMany({
            where: and(
                eq(discounts.programId, currentDiscount.programId),
                gte(discounts.endDate, formattedStartDate),
                lte(discounts.startDate, formattedEndDate)
            ),
            with: {
                packageDiscounts: {
                    with: {
                        package: true
                    }
                }
            }
        })

        const otherOverlappingDiscounts = overlappingDiscounts.filter(d => d.id !== id)

        const overlappingPackages = otherOverlappingDiscounts.flatMap(discount =>
            discount.packageDiscounts.filter(pd =>
                packageIds.includes(pd.package.id)
            ).map(pd => pd.package.name)
        )

        if (overlappingPackages.length > 0) {
            return {
                error: `Some packages already have discounts in this date range: ${overlappingPackages.join(', ')}`
            }
        }

        // Update discount with formatted dates
        await db.update(discounts)
            .set({
                type: type as any, // Type assertion needed due to enum
                value,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                updatedAt: new Date().toISOString()
            })
            .where(eq(discounts.id, id))

        // Delete existing package associations
        await db.delete(packageDiscount)
            .where(eq(packageDiscount.discountId, id))

        // Create new package associations with formatted dates
        if (packageIds.length > 0) {
            await db.insert(packageDiscount)
                .values(
                    packageIds.map(packageId => ({
                        packageId,
                        discountId: id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }))
                )
        }

        revalidatePath('/programs')
        return { success: true }

    } catch (error) {
        console.error('Error updating discount:', error)
        return { error: 'Failed to update discount' }
    }
}

export async function deleteDiscount(id: number) {
    try {
        await db.delete(discounts)
            .where(eq(discounts.id, id))

        revalidatePath('/programs')
        return { success: true }

    } catch (error) {
        console.error('Error deleting discount:', error)
        return { error: 'Failed to delete discount' }
    }
}

// export async function getProgramDiscounts(programId: number) {
//     try {
//         const programDiscounts = await db.query.discounts.findMany({
//             where: eq(discounts.programId, programId),
//             with: {
//                 packageDiscounts: {
//                     with: {
//                         package: true
//                     }
//                 }
//             },
//             orderBy: (discounts, { desc }) => [desc(discounts.createdAt)]
//         })

//         return programDiscounts

//     } catch (error) {
//         console.error('Error fetching program discounts:', error)
//         return []
//     }
// }

export async function getProgramDiscounts(url: string | null, programId: number) {
    if (!url) return { data: null, error: null }
    try {
        const programDiscounts = await db.query.discounts.findMany({
            where: eq(discounts.programId, programId),
            with: {
                packageDiscounts: {
                    with: {
                        package: {
                            columns: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: (discounts, { desc }) => [desc(discounts.createdAt)]
        })

        // Transform the data to match the expected format
        const transformedDiscounts = programDiscounts.map(discount => ({
            id: discount.id,
            type: discount.type,
            value: discount.value,
            startDate: new Date(discount.startDate),
            endDate: new Date(discount.endDate),
            packageIds: discount.packageDiscounts.map(pd => pd.package.id)
        }))

        return {
            data: transformedDiscounts,
            error: null
        }

    } catch (error) {
        console.error('Error fetching program discounts:', error)
        return {
            data: [],
            error: 'Failed to fetch discounts'
        }
    }
}