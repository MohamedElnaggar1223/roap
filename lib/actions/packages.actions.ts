'use server'

import { db } from '@/db'
import { packages, schedules } from '@/db/schema'
import { auth } from '@/auth'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { formatDateForDB } from '../utils'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

interface Schedule {
    id?: number
    day: string
    from: string
    to: string
    memo: string | undefined
}

function getFirstAndLastDayOfMonths(months: string[]) {
    if (!months.length) return { startDate: new Date(), endDate: new Date() }

    // Sort months chronologically
    const sortedMonths = [...months].sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
    });

    // Get first day of first month
    const firstMonth = new Date(sortedMonths[0]);
    const startDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1);

    // Get last day of last month
    const lastMonth = new Date(sortedMonths[sortedMonths.length - 1]);
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    return { startDate, endDate };
}

export async function createPackage(data: {
    name: string
    price: number
    startDate?: Date
    endDate?: Date
    months?: string[]
    programId: number
    memo?: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: Date
    entryFeesEndDate?: Date
    schedules: Schedule[]
    capacity: number
    type: 'Monthly' | 'Term' | 'Full Season' | 'Assessment'
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        return await db.transaction(async (tx) => {
            // For Monthly packages, calculate start and end dates from months
            let startDate = data.startDate;
            let endDate = data.endDate;

            if (data.type === 'Monthly' && data.months && data.months.length > 0) {
                const dates = getFirstAndLastDayOfMonths(data.months);
                startDate = dates.startDate;
                endDate = dates.endDate;
            }

            const [newPackage] = await tx
                .insert(packages)
                .values({
                    name: data.name,
                    price: data.price,
                    startDate: formatDateForDB(startDate!),
                    endDate: formatDateForDB(endDate!),
                    months: data.type === 'Monthly' ? data.months : null,
                    programId: data.programId,
                    memo: data.memo,
                    entryFees: data.entryFees,
                    entryFeesExplanation: data.entryFeesExplanation,
                    entryFeesAppliedUntil: data.entryFeesAppliedUntil || null,
                    entryFeesStartDate: data.entryFeesStartDate ?
                        formatDateForDB(data.entryFeesStartDate) : null,
                    entryFeesEndDate: data.entryFeesEndDate ?
                        formatDateForDB(data.entryFeesEndDate) : null,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`,
                    sessionPerWeek: data.schedules.length,
                    capacity: data.capacity
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
            revalidatePath('/academy/assessments')
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
    startDate?: Date
    endDate?: Date
    months?: string[]
    memo?: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: Date
    entryFeesEndDate?: Date
    schedules: Schedule[]
    capacity: number
    type: 'Monthly' | 'Term' | 'Full Season' | 'Assessment'
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        await db.transaction(async (tx) => {
            // For Monthly packages, calculate start and end dates from months
            let startDate = data.startDate;
            let endDate = data.endDate;

            if (data.type === 'Monthly' && data.months && data.months.length > 0) {
                const dates = getFirstAndLastDayOfMonths(data.months);
                startDate = dates.startDate;
                endDate = dates.endDate;
            }

            await tx
                .update(packages)
                .set({
                    name: data.name,
                    price: data.price,
                    startDate: startDate?.toLocaleString(),
                    endDate: endDate?.toLocaleString(),
                    months: data.type === 'Monthly' ? data.months : null,
                    memo: data.memo,
                    entryFees: data.entryFees,
                    entryFeesExplanation: data.entryFeesExplanation,
                    entryFeesAppliedUntil: data.entryFeesAppliedUntil || null,
                    entryFeesStartDate: data.entryFeesStartDate ?
                        data.entryFeesStartDate?.toLocaleString() : null,
                    entryFeesEndDate: data.entryFeesEndDate ?
                        data.entryFeesEndDate?.toLocaleString() : null,
                    updatedAt: sql`now()`,
                    sessionPerWeek: data.schedules.length,
                    capacity: data.capacity
                })
                .where(eq(packages.id, id))

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
        revalidatePath('/academy/assessments')
        return { success: true, error: null }
    } catch (error) {
        console.error('Error updating package:', error)
        return { error: 'Failed to update package' }
    }
}

export async function getProgramPackages(url: string | null, programId: number) {
    if (!url) return { data: null, error: null }
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const cookieStore = await cookies()
    const impersonatedId = session.user.role === 'admin'
        ? cookieStore.get('impersonatedAcademyId')?.value
        : null

    const academicId = session.user.role === 'admin' && impersonatedId
        ? parseInt(impersonatedId)
        : parseInt(session.user.id)

    if (session.user.role !== 'admin' && session.user.role !== 'academic') {
        return { error: 'You are not authorized to perform this action', field: null, data: [] }
    }

    const packagesWithSchedules = await db
        .select({
            id: packages.id,
            name: packages.name,
            price: packages.price,
            startDate: packages.startDate,
            endDate: packages.endDate,
            months: packages.months,
            memo: packages.memo,
            entryFees: packages.entryFees,
            entryFeesExplanation: packages.entryFeesExplanation,
            entryFeesAppliedUntil: packages.entryFeesAppliedUntil,
            entryFeesStartDate: packages.entryFeesStartDate,
            entryFeesEndDate: packages.entryFeesEndDate,
            capacity: packages.capacity,
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
                schedules: pkg.schedules?.[0]?.id === null ? [] : pkg.schedules,
                type: pkg.name.startsWith('Term') ? 'Term' as const :
                    pkg.name.toLowerCase().includes('monthly') ? 'Monthly' as const :
                        'Full Season' as const,
                termNumber: pkg.name.startsWith('Term') ?
                    parseInt(pkg.name.split(' ')[1]) : undefined
            }))
        )

    return { data: packagesWithSchedules, error: null }
}