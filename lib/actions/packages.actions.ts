'use server'

import { db } from '@/db'
import { packages, schedules } from '@/db/schema'
import { auth } from '@/auth'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { formatDateForDB } from '../utils'
import { revalidatePath } from 'next/cache'

interface Schedule {
    id: number
    day: string
    from: string
    to: string
    memo: string | undefined
}

export async function getProgramPackages(url: string | null, programId: number) {
    if (!url) return
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const packagesWithSchedules = await db
        .select({
            id: packages.id,
            name: packages.name,
            price: packages.price,
            startDate: packages.startDate,
            endDate: packages.endDate,
            memo: packages.memo,
            schedules: sql<Schedule[]>`json_agg(
                json_build_object(
                    'id', ${schedules.id},
                    'day', ${schedules.day},
                    'from', ${schedules.from},
                    'to', ${schedules.to},
                    'memo', ${schedules.memo}
                )
                ORDER BY ${schedules.createdAt} ASC
            )`
        })
        .from(packages)
        .leftJoin(schedules, eq(packages.id, schedules.packageId))
        .where(eq(packages.programId, programId))
        .groupBy(packages.id)
        .orderBy(asc(packages.createdAt))
        .then(results =>
            results.map(pkg => ({
                ...pkg,
                // Handle cases where there are no schedules (null from json_agg)
                schedules: pkg.schedules?.[0]?.id === null ? [] : pkg.schedules,
                // Determine package type from name
                type: pkg.name.startsWith('Term') ? 'Term' as const :
                    pkg.name.toLowerCase().includes('monthly') ? 'Monthly' as const :
                        'Full Season' as const,
                // Extract term number if it's a Term package
                termNumber: pkg.name.startsWith('Term') ?
                    parseInt(pkg.name.split(' ')[1]) : undefined
            }))
        )

    return { data: packagesWithSchedules }
}

// export async function createPackage(data: {
//     name: string
//     price: number
//     startDate: Date
//     endDate: Date
//     sessionPerWeek: number
//     sessionDuration: number | null
//     programId: number
//     memo?: string | null
// }) {
//     const session = await auth()

//     if (!session?.user || session.user.role !== 'academic') {
//         return { error: 'Unauthorized' }
//     }

//     try {
//         const [newPackage] = await db
//             .insert(packages)
//             .values({
//                 ...data,
//                 startDate: formatDateForDB(data.startDate),
//                 endDate: formatDateForDB(data.endDate),
//                 createdAt: sql`now()`,
//                 updatedAt: sql`now()`,
//             })
//             .returning({
//                 id: packages.id
//             })

//         revalidatePath('/academy/programs')
//         return { data: newPackage }
//     } catch (error) {
//         console.error('Error creating package:', error)
//         return { error: 'Failed to create package' }
//     }
// }

// export async function updatePackage(id: number, data: {
//     name: string
//     price: number
//     startDate: Date
//     endDate: Date
//     sessionPerWeek: number
//     sessionDuration: number | null
//     memo?: string | null
// }) {
//     const session = await auth()

//     if (!session?.user || session.user.role !== 'academic') {
//         return { error: 'Unauthorized' }
//     }

//     try {
//         await db
//             .update(packages)
//             .set({
//                 ...data,
//                 startDate: formatDateForDB(data.startDate),
//                 endDate: formatDateForDB(data.endDate),
//                 updatedAt: sql`now()`
//             })
//             .where(eq(packages.id, id))

//         revalidatePath('/academy/programs')
//         return { success: true }
//     } catch (error) {
//         console.error('Error updating package:', error)
//         return { error: 'Failed to update package' }
//     }
// }

export async function createPackage(data: {
    name: string
    price: number
    startDate: Date
    endDate: Date
    programId: number
    memo?: string | null
    schedules: {
        day: string
        from: string
        to: string
        memo: string | null
    }[]
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        return await db.transaction(async (tx) => {
            const [newPackage] = await tx
                .insert(packages)
                .values({
                    name: data.name,
                    price: data.price,
                    startDate: formatDateForDB(data.startDate),
                    endDate: formatDateForDB(data.endDate),
                    programId: data.programId,
                    memo: data.memo,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`,
                    sessionPerWeek: data.schedules.length
                })
                .returning({
                    id: packages.id
                })

            if (data.schedules.length > 0) {
                await tx.insert(schedules)
                    .values(
                        data.schedules.map(schedule => ({
                            packageId: newPackage.id,
                            day: schedule.day,
                            from: schedule.from,
                            to: schedule.to,
                            memo: schedule.memo,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))
                    )
            }

            revalidatePath('/academy/programs')
            return { data: newPackage, error: null }
        })
    } catch (error) {
        console.error('Error creating package:', error)
        return { error: 'Failed to create package' }
    }
}

export async function updatePackage(id: number, data: {
    name: string
    price: number
    startDate: Date
    endDate: Date
    memo?: string | null
    schedules: {
        id?: number
        day: string
        from: string
        to: string
        memo: string | null
    }[]
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    console.log("updatePackage sch: ", data.schedules)

    try {
        await db.transaction(async (tx) => {
            // Update package details
            await tx
                .update(packages)
                .set({
                    name: data.name,
                    price: data.price,
                    startDate: formatDateForDB(data.startDate),
                    endDate: formatDateForDB(data.endDate),
                    memo: data.memo,
                    updatedAt: sql`now()`,
                    sessionPerWeek: data.schedules.length ?? 0
                })
                .where(eq(packages.id, id))

            // Get current schedules
            const currentSchedules = await tx
                .select({ id: schedules.id })
                .from(schedules)
                .where(eq(schedules.packageId, id))

            const currentScheduleIds = currentSchedules.map(s => s.id)
            const newSchedules = data.schedules.filter(s => !s.id)
            const schedulesToUpdate = data.schedules.filter(s => s.id && currentScheduleIds.includes(s.id))
            const schedulesToDelete = currentScheduleIds.filter(id =>
                !data.schedules.find(s => s.id === id)
            )

            if (schedulesToDelete.length > 0) {
                await tx
                    .delete(schedules)
                    .where(and(
                        eq(schedules.packageId, id),
                        inArray(schedules.id, schedulesToDelete)
                    ))
            }

            if (newSchedules.length > 0) {
                await tx
                    .insert(schedules)
                    .values(
                        newSchedules.map(schedule => ({
                            packageId: id,
                            day: schedule.day,
                            from: schedule.from,
                            to: schedule.to,
                            memo: schedule.memo,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))
                    )
            }

            for (const schedule of schedulesToUpdate) {
                await tx
                    .update(schedules)
                    .set({
                        day: schedule.day,
                        from: schedule.from,
                        to: schedule.to,
                        memo: schedule.memo,
                        updatedAt: sql`now()`
                    })
                    .where(eq(schedules.id, schedule.id!))
            }
        })

        revalidatePath('/academy/programs')
        return { success: true, error: null }
    } catch (error) {
        console.error('Error updating package:', error)
        return { error: 'Failed to update package' }
    }
}

export async function deletePackage(id: number) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        await db.delete(packages).where(eq(packages.id, id))
        revalidatePath('/academy/programs')
        return { success: true }
    } catch (error) {
        console.error('Error deleting package:', error)
        return { error: 'Failed to delete package' }
    }
}