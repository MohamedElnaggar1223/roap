'use server'

import { SQL, and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { bookings, bookingSessions, packages, programs, coaches, sports, branches, users, academics, sportTranslations, branchTranslations } from '@/db/schema'
import { auth } from '@/auth'
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns'

type DashboardStats = {
    currentMonthCount: number
    lastMonthCount: number
    totalBookings: number
    timeTraffic: Array<{ hour: string; count: number }>
    packageTraffic: Array<{ name: string | null; count: number }>
    programTraffic: Array<{ name: string | null; count: number }>
    coachTraffic: Array<{ name: string | null; count: number }>
    sportTraffic: Array<{ name: string; count: number }>
    branchTraffic: Array<{ name: string; count: number }>
}

export interface DashboardResponse {
    data?: DashboardStats
    error?: string
}

export async function getDashboardStats(): Promise<DashboardResponse> {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academy) {
        return { error: 'Academy not found' }
    }

    const currentDate = new Date()
    const startCurrentMonth = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const endCurrentMonth = format(endOfMonth(currentDate), 'yyyy-MM-dd')
    const startLastMonth = format(startOfMonth(addMonths(currentDate, -1)), 'yyyy-MM-dd')
    const endLastMonth = format(endOfMonth(addMonths(currentDate, -1)), 'yyyy-MM-dd')

    try {
        const results = await db.transaction(async (tx) => {
            // Get current month bookings count
            const [currentMonthCount] = await tx
                .select({
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        sql`DATE(${bookingSessions.date}) >= ${startCurrentMonth}::date`,
                        sql`DATE(${bookingSessions.date}) <= ${endCurrentMonth}::date`
                    )
                )

            // Get last month bookings count
            const [lastMonthCount] = await tx
                .select({
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        sql`DATE(${bookingSessions.date}) >= ${startLastMonth}::date`,
                        sql`DATE(${bookingSessions.date}) <= ${endLastMonth}::date`
                    )
                )

            // Get total bookings
            // const [totalBookings] = await tx
            //     .select({
            //         count: sql<number>`count(*)::int`,
            //     })
            //     .from(bookingSessions)
            //     .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
            //     .innerJoin(packages, eq(bookings.packageId, packages.id))
            //     .innerJoin(programs, eq(packages.programId, programs.id))
            //     .where(eq(programs.academicId, academy.id))
            const [totalBookings] = await tx
                .select({
                    count: sql<number>`count(*)::int`,
                })
                .from(bookings)
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(eq(programs.academicId, academy.id))

            // Get traffic by time
            const timeTraffic = await tx
                .select({
                    hour: sql<string>`to_char(${bookingSessions.from}::time, 'HH24:MI')`,
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(sql`to_char(${bookingSessions.from}::time, 'HH24:MI')`)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by package
            const packageTraffic = await tx
                .select({
                    name: packages.name,
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(packages.name)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by program
            const programTraffic = await tx
                .select({
                    name: programs.name,
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(programs.name)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by coach
            const coachTraffic = await tx
                .select({
                    name: coaches.name,
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(coaches, eq(bookings.coachId, coaches.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(coaches.name)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by sport
            const sportTraffic = await tx
                .select({
                    name: sportTranslations.name,
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(
                    sportTranslations,
                    and(
                        eq(sports.id, sportTranslations.sportId),
                        eq(sportTranslations.locale, 'en')
                    )
                )
                .where(eq(programs.academicId, academy.id))
                .groupBy(sportTranslations.name)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by branch
            const branchTraffic = await tx
                .select({
                    name: branchTranslations.name,
                    count: sql<number>`count(*)::int`,
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(
                    branchTranslations,
                    and(
                        eq(branches.id, branchTranslations.branchId),
                        eq(branchTranslations.locale, 'en')
                    )
                )
                .where(eq(programs.academicId, academy.id))
                .groupBy(branchTranslations.name)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            const stats: DashboardStats = {
                currentMonthCount: currentMonthCount.count,
                lastMonthCount: lastMonthCount.count,
                totalBookings: totalBookings.count,
                timeTraffic,
                packageTraffic,
                programTraffic,
                coachTraffic,
                sportTraffic,
                branchTraffic,
            }

            return stats
        })

        return { data: results }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return { error: 'Failed to fetch dashboard statistics' }
    }
}