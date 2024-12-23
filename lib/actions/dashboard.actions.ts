'use server'

import { SQL, and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { bookings, bookingSessions, packages, programs, coaches, sports, branches, users, academics, sportTranslations, branchTranslations } from '@/db/schema'
import { auth } from '@/auth'
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { cookies } from 'next/headers'

type DashboardStats = {
    currentMonthCount: number
    lastMonthCount: number
    totalBookings: number
    timeTraffic: Array<{ hour: string; count: number; date: string }>
    packageTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string; genders: string }>
    programTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string; genders: string }>
    coachTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string }>
    sportTraffic: Array<{ name: string; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string }>
    branchTraffic: Array<{ name: string; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string }>
}

export interface DashboardResponse {
    data?: DashboardStats
    error?: string
}

export interface DashboardStatsParams {
    location?: string
    sport?: string
    program?: string
    gender?: string
}

export async function getDashboardStats(params: DashboardStatsParams = {}): Promise<DashboardResponse> {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', data: {} as any }
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
        return { error: 'You are not authorized to perform this action', data: {} as any }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
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

    const { location, sport, program, gender } = params

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
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        sql`DATE(${bookingSessions.date}) >= ${startCurrentMonth}::date`,
                        sql`DATE(${bookingSessions.date}) <= ${endCurrentMonth}::date`,
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
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
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        sql`DATE(${bookingSessions.date}) >= ${startLastMonth}::date`,
                        sql`DATE(${bookingSessions.date}) <= ${endLastMonth}::date`,
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )

            // Get total bookings
            const [totalBookings] = await tx
                .select({
                    count: sql<number>`count(*)::int`,
                })
                .from(bookings)
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )

            // Get traffic by time
            const timeTraffic = await tx
                .select({
                    hour: sql<string>`to_char(${bookingSessions.from}::time, 'HH24:MI')`,
                    count: sql<number>`count(*)::int`,
                    date: bookings.createdAt,
                    branchName: branchTranslations.name,
                    genders: programs.gender
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )
                .groupBy(sql`to_char(${bookingSessions.from}::time, 'HH24:MI')`, bookings.createdAt, branchTranslations.name, programs.gender)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by package
            const packageTraffic = await tx
                .select({
                    name: packages.name,
                    count: sql<number>`count(*)::int`,
                    branchName: branchTranslations.name,
                    sportName: sportTranslations.name,
                    programName: sql<string>`COALESCE(${programs.name}, '')`,
                    date: bookings.createdAt,
                    genders: programs.gender
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )
                .groupBy(packages.name, branchTranslations.name, sportTranslations.name, programs.name, bookings.createdAt, programs.gender)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by program
            const programTraffic = await tx
                .select({
                    name: programs.name,
                    count: sql<number>`count(*)::int`,
                    branchName: branchTranslations.name,
                    sportName: sportTranslations.name,
                    programName: sql<string>`COALESCE(${programs.name}, '')`,
                    date: bookings.createdAt,
                    genders: programs.gender
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )
                .groupBy(programs.name, branchTranslations.name, sportTranslations.name, bookings.createdAt, programs.gender)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by coach
            const coachTraffic = await tx
                .select({
                    name: coaches.name,
                    count: sql<number>`count(*)::int`,
                    branchName: branchTranslations.name,
                    sportName: sportTranslations.name,
                    programName: sql<string>`COALESCE(${programs.name}, '')`,
                    date: bookings.createdAt,
                    genders: programs.gender
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(coaches, eq(bookings.coachId, coaches.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )
                .groupBy(coaches.name, branchTranslations.name, sportTranslations.name, programs.name, bookings.createdAt, programs.gender)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by sport
            const sportTraffic = await tx
                .select({
                    name: sportTranslations.name,
                    count: sql<number>`count(*)::int`,
                    branchName: branchTranslations.name,
                    sportName: sportTranslations.name,
                    programName: sql<string>`COALESCE(${programs.name}, '')`,
                    date: bookings.createdAt,
                    genders: programs.gender
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
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )
                .groupBy(sportTranslations.name, branchTranslations.name, programs.name, bookings.createdAt, programs.gender)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            // Get traffic by branch
            const branchTraffic = await tx
                .select({
                    name: branchTranslations.name,
                    count: sql<number>`count(*)::int`,
                    branchName: branchTranslations.name,
                    sportName: sportTranslations.name,
                    programName: sql<string>`COALESCE(${programs.name}, '')`,
                    date: bookings.createdAt,
                    genders: programs.gender
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
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
                .where(
                    and(
                        eq(programs.academicId, academy.id),
                        location ? eq(branchTranslations.name, location) : sql`true`,
                        sport ? eq(sportTranslations.name, sport) : sql`true`,
                        program ? eq(programs.name, program) : sql`true`,
                        gender ? eq(programs.gender, gender) : sql`true`
                    )
                )
                .groupBy(branchTranslations.name, sportTranslations.name, programs.name, bookings.createdAt, programs.gender)
                .orderBy(sql`count(*) desc`)
                .limit(4)

            const stats: DashboardStats = {
                currentMonthCount: currentMonthCount.count,
                lastMonthCount: lastMonthCount.count,
                totalBookings: totalBookings.count,
                timeTraffic: timeTraffic as DashboardStats['timeTraffic'],
                packageTraffic: packageTraffic as DashboardStats['packageTraffic'],
                programTraffic: programTraffic as DashboardStats['programTraffic'],
                coachTraffic: coachTraffic as DashboardStats['coachTraffic'],
                sportTraffic: sportTraffic as DashboardStats['sportTraffic'],
                branchTraffic: branchTraffic as DashboardStats['branchTraffic'],
            }

            return stats
        })

        return { data: results }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return { error: 'Failed to fetch dashboard statistics' }
    }
}

