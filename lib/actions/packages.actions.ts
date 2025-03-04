'use server'

import { db } from '@/db'
import { packages, schedules } from '@/db/schema'
import { auth } from '@/auth'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { formatDateForDB } from '../utils'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
    startDateOfBirth: string | null | undefined
    endDateOfBirth: string | null | undefined
    gender: string | null | undefined
    capacity: number | null | undefined
    hidden?: boolean
    id?: number
    // Add new age fields
    startAgeMonths?: number | null
    endAgeMonths?: number | null
    isEndAgeUnlimited?: boolean
}

function getFirstAndLastDayOfMonths(months: string[]) {
    if (!months.length) return { startDate: new Date(), endDate: new Date() }

    const sortedMonths = [...months].sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
    });

    // Get first day of first month
    const firstMonth = new Date(sortedMonths[0]);
    const startDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1);

    // Get last day of last month - FIXED VERSION
    const lastMonth = new Date(sortedMonths[sortedMonths.length - 1]);
    let endYear = lastMonth.getFullYear();
    let endMonth = lastMonth.getMonth() + 1;

    // Handle year rollover
    if (endMonth > 11) {  // if past December
        endMonth = 0;     // set to January
        endYear++;        // increment year
    }

    // Get the last day by getting day 0 of next month
    const endDate = new Date(endYear, endMonth, 0);

    return { startDate, endDate };
}

export async function createPackage(data: {
    name: string
    price: number
    startDate?: string
    endDate?: string
    months?: string[]
    programId: number
    memo?: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: string
    entryFeesEndDate?: string
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
                startDate = formatDateForDB(dates.startDate);
                endDate = formatDateForDB(dates.endDate);
            }

            const [newPackage] = await tx
                .insert(packages)
                .values({
                    name: data.name,
                    price: data.price,
                    startDate: startDate!,
                    endDate: endDate!,
                    months: data.type === 'Monthly' ? data.months : null,
                    programId: data.programId,
                    memo: data.memo,
                    entryFees: data.entryFees,
                    entryFeesExplanation: data.entryFeesExplanation,
                    entryFeesAppliedUntil: data.entryFeesAppliedUntil || null,
                    entryFeesStartDate: data.entryFeesStartDate ?
                        data.entryFeesStartDate : null,
                    entryFeesEndDate: data.entryFeesEndDate ?
                        data.entryFeesEndDate : null,
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
                            startAgeMonths: schedule.startAgeMonths,
                            endAgeMonths: schedule.endAgeMonths,
                            isEndAgeUnlimited: schedule.isEndAgeUnlimited,
                            startDateOfBirth: schedule.startDateOfBirth,
                            endDateOfBirth: schedule.endDateOfBirth,
                            gender: schedule.gender,
                            hidden: schedule.hidden ?? false,
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
    startDate?: string
    endDate?: string
    months?: string[]
    memo?: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: string
    entryFeesEndDate?: string
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
                startDate = formatDateForDB(dates.startDate);
                endDate = formatDateForDB(dates.endDate);
            }

            console.log("START DATE FROM UPDATE", startDate)
            console.log("END DATE FROM UPDATE", endDate)

            await tx
                .update(packages)
                .set({
                    name: data.name,
                    price: data.price,
                    startDate: startDate!,
                    endDate: endDate!,
                    months: data.type === 'Monthly' ? data.months : null,
                    memo: data.memo,
                    entryFees: data.entryFees,
                    entryFeesExplanation: data.entryFeesExplanation,
                    entryFeesAppliedUntil: data.entryFeesAppliedUntil || null,
                    entryFeesStartDate: data.entryFeesStartDate ?
                        data.entryFeesStartDate : null,
                    entryFeesEndDate: data.entryFeesEndDate ?
                        data.entryFeesEndDate : null,
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

            console.log("SCHEDULES TO DELETE", schedulesToDelete)
            console.log("SCHEDULES TO UPDATE", schedulesToUpdate)
            console.log("NEW SCHEDULES", newSchedules)

            if (schedulesToDelete.length > 0) {
                await tx
                    .delete(schedules)
                    .where(and(
                        eq(schedules.packageId, id),
                        inArray(schedules.id, schedulesToDelete)
                    ))
            }

            console.log("NEW SCHEDULES TO ADD", newSchedules)

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
                            startDateOfBirth: schedule.startDateOfBirth,
                            endDateOfBirth: schedule.endDateOfBirth,
                            gender: schedule.gender,
                            startAgeMonths: schedule.startAgeMonths,
                            endAgeMonths: schedule.endAgeMonths,
                            isEndAgeUnlimited: schedule.isEndAgeUnlimited,
                            capacity: schedule.capacity ?? 9999,
                            hidden: schedule.hidden ?? false,
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
                        updatedAt: sql`now()`,
                        startAgeMonths: schedule.startAgeMonths,
                        endAgeMonths: schedule.endAgeMonths,
                        isEndAgeUnlimited: schedule.isEndAgeUnlimited,
                        startDateOfBirth: schedule.startDateOfBirth,
                        endDateOfBirth: schedule.endDateOfBirth,
                        gender: schedule.gender,
                        capacity: schedule.capacity ?? 9999,
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
            hidden: packages.hidden,
            schedules: sql<Schedule[]>`json_agg(
                json_build_object(
                    'id', ${schedules.id},
                    'day', ${schedules.day},
                    'from', ${schedules.from},
                    'to', ${schedules.to},
                    'memo', ${schedules.memo},
                    'startDateOfBirth', ${schedules.startDateOfBirth},
                    'endDateOfBirth', ${schedules.endDateOfBirth},
                    'gender', ${schedules.gender},
                    'capacity', ${schedules.capacity},
                    'hidden', ${schedules.hidden}
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