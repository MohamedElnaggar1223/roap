'use server'

import { db } from '@/db'
import {
    bookings, bookingSessions, packages, programs, branches, sports, coaches,
    branchTranslations, sportTranslations, academicSport, academicAthletic
} from '@/db/schema'
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm'
import { checkAcademyStatus } from './check-academy-status'
import { cache } from 'react'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'

// Optimized dashboard types
type OptimizedDashboardStats = {
    currentMonthBookings: number
    lastMonthBookings: number
    totalBookings: number
    totalAthletes: number
    totalPrograms: number
    totalBranches: number
    monthlyGrowth: number
    topPackages: Array<{ name: string; count: number; revenue: number }>
    topSports: Array<{ name: string; count: number }>
    topBranches: Array<{ name: string; count: number }>
    timeDistribution: Array<{ hour: string; count: number }>
    recentActivity: Array<{ type: string; description: string; date: Date }>
}

export type OptimizedDashboardResponse = {
    data?: OptimizedDashboardStats
    error?: string
}

// Cached dashboard stats with 5-minute refresh
export const getDashboardStats = cache(async (): Promise<OptimizedDashboardResponse> => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        const currentDate = new Date()
        const startCurrentMonth = format(startOfMonth(currentDate), 'yyyy-MM-dd')
        const endCurrentMonth = format(endOfMonth(currentDate), 'yyyy-MM-dd')
        const startLastMonth = format(startOfMonth(addMonths(currentDate, -1)), 'yyyy-MM-dd')
        const endLastMonth = format(endOfMonth(addMonths(currentDate, -1)), 'yyyy-MM-dd')

        // Single optimized query for basic counts using our new indexes
        const [basicStats] = await db
            .select({
                totalBookings: sql<number>`COUNT(DISTINCT ${bookings.id})::int`,
                totalAthletes: sql<number>`COUNT(DISTINCT ${academicAthletic.id})::int`,
                totalPrograms: sql<number>`COUNT(DISTINCT ${programs.id})::int`,
                totalBranches: sql<number>`COUNT(DISTINCT ${branches.id})::int`,
                currentMonthBookings: sql<number>`
                    COUNT(DISTINCT CASE 
                        WHEN DATE(${bookingSessions.date}) >= '${startCurrentMonth}'::date 
                        AND DATE(${bookingSessions.date}) <= '${endCurrentMonth}'::date 
                        THEN ${bookings.id} 
                    END)::int
                `,
                lastMonthBookings: sql<number>`
                    COUNT(DISTINCT CASE 
                        WHEN DATE(${bookingSessions.date}) >= '${startLastMonth}'::date 
                        AND DATE(${bookingSessions.date}) <= '${endLastMonth}'::date 
                        THEN ${bookings.id} 
                    END)::int
                `,
            })
            .from(programs)
            .leftJoin(branches, eq(programs.branchId, branches.id))
            .leftJoin(academicAthletic, eq(academicAthletic.academicId, academy.id))
            .leftJoin(packages, eq(packages.programId, programs.id))
            .leftJoin(bookings, eq(bookings.packageId, packages.id))
            .leftJoin(bookingSessions, eq(bookingSessions.bookingId, bookings.id))
            .where(eq(programs.academicId, academy.id))

        // Calculate growth percentage
        const monthlyGrowth = basicStats.lastMonthBookings > 0
            ? Math.round(((basicStats.currentMonthBookings - basicStats.lastMonthBookings) / basicStats.lastMonthBookings) * 100)
            : 0

        // Parallel queries for detailed stats (using our optimized indexes)
        const [topPackages, topSports, topBranches, timeDistribution] = await Promise.all([
            // Top packages with revenue
            db
                .select({
                    name: packages.name,
                    count: sql<number>`COUNT(*)::int`,
                    revenue: sql<number>`SUM(${bookings.price})::int`
                })
                .from(bookings)
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(packages.id, packages.name)
                .orderBy(desc(sql`COUNT(*)`))
                .limit(5),

            // Top sports
            db
                .select({
                    name: sportTranslations.name,
                    count: sql<number>`COUNT(DISTINCT ${bookings.id})::int`
                })
                .from(programs)
                .innerJoin(sports, eq(programs.sportId, sports.id))
                .innerJoin(sportTranslations, and(
                    eq(sports.id, sportTranslations.sportId),
                    eq(sportTranslations.locale, 'en')
                ))
                .innerJoin(packages, eq(packages.programId, programs.id))
                .innerJoin(bookings, eq(bookings.packageId, packages.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(sports.id, sportTranslations.name)
                .orderBy(desc(sql`COUNT(DISTINCT ${bookings.id})`))
                .limit(5),

            // Top branches
            db
                .select({
                    name: branchTranslations.name,
                    count: sql<number>`COUNT(DISTINCT ${bookings.id})::int`
                })
                .from(programs)
                .innerJoin(branches, eq(programs.branchId, branches.id))
                .innerJoin(branchTranslations, and(
                    eq(branches.id, branchTranslations.branchId),
                    eq(branchTranslations.locale, 'en')
                ))
                .innerJoin(packages, eq(packages.programId, programs.id))
                .innerJoin(bookings, eq(bookings.packageId, packages.id))
                .where(eq(programs.academicId, academy.id))
                .groupBy(branches.id, branchTranslations.name)
                .orderBy(desc(sql`COUNT(DISTINCT ${bookings.id})`))
                .limit(5),

            // Time distribution (simplified)
            db
                .select({
                    hour: sql<string>`EXTRACT(hour FROM ${bookingSessions.from}::time)::text`,
                    count: sql<number>`COUNT(*)::int`
                })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(and(
                    eq(programs.academicId, academy.id),
                    gte(bookingSessions.date, sql`CURRENT_DATE - INTERVAL '30 days'`)
                ))
                .groupBy(sql`EXTRACT(hour FROM ${bookingSessions.from}::time)`)
                .orderBy(desc(sql`COUNT(*)`))
                .limit(8)
        ])

        // Build response
        const dashboardStats: OptimizedDashboardStats = {
            currentMonthBookings: basicStats.currentMonthBookings,
            lastMonthBookings: basicStats.lastMonthBookings,
            totalBookings: basicStats.totalBookings,
            totalAthletes: basicStats.totalAthletes,
            totalPrograms: basicStats.totalPrograms,
            totalBranches: basicStats.totalBranches,
            monthlyGrowth,
            topPackages: topPackages.map(p => ({
                name: p.name,
                count: p.count,
                revenue: p.revenue
            })),
            topSports: topSports.map(s => ({
                name: s.name,
                count: s.count
            })),
            topBranches: topBranches.map(b => ({
                name: b.name,
                count: b.count
            })),
            timeDistribution: timeDistribution.map(t => ({
                hour: `${t.hour}:00`,
                count: t.count
            })),
            recentActivity: [] // Can be populated separately if needed
        }

        return { data: dashboardStats }

    } catch (error) {
        console.error('Error fetching optimized dashboard stats:', error)
        return {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
})

// Quick stats for overview cards (ultra-fast)
export const getQuickStats = cache(async () => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        // Parallel subqueries for essential numbers  
        const [totalPrograms, totalAthletes, totalBookingsToday, upcomingSessionsToday] = await Promise.all([
            db.select({ count: sql<number>`COUNT(*)::int` })
                .from(programs)
                .where(eq(programs.academicId, academy.id)),

            db.select({ count: sql<number>`COUNT(*)::int` })
                .from(academicAthletic)
                .where(eq(academicAthletic.academicId, academy.id)),

            db.select({ count: sql<number>`COUNT(DISTINCT ${bookings.id})::int` })
                .from(bookings)
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .innerJoin(bookingSessions, eq(bookingSessions.bookingId, bookings.id))
                .where(and(
                    eq(programs.academicId, academy.id),
                    sql`DATE(${bookingSessions.date}) = CURRENT_DATE`
                )),

            db.select({ count: sql<number>`COUNT(*)::int` })
                .from(bookingSessions)
                .innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
                .innerJoin(packages, eq(bookings.packageId, packages.id))
                .innerJoin(programs, eq(packages.programId, programs.id))
                .where(and(
                    eq(programs.academicId, academy.id),
                    sql`DATE(${bookingSessions.date}) = CURRENT_DATE`,
                    sql`${bookingSessions.from} > CURRENT_TIME`
                ))
        ])

        const stats = {
            totalPrograms: totalPrograms[0].count,
            totalAthletes: totalAthletes[0].count,
            totalBookingsToday: totalBookingsToday[0].count,
            upcomingSessionsToday: upcomingSessionsToday[0].count
        }

        return { data: stats }
    } catch (error) {
        console.error('Error fetching quick stats:', error)
        return { error: 'Failed to fetch stats' }
    }
})

// Revenue analytics (separate cached function)
export const getRevenueStats = cache(async () => {
    try {
        const academyResult = await checkAcademyStatus()
        if (academyResult.shouldRedirect || !academyResult.academyId) {
            return { error: 'Academy not found or requires redirect' }
        }

        const academy = { id: academyResult.academyId }

        const [revenue] = await db
            .select({
                totalRevenue: sql<number>`COALESCE(SUM(${bookings.price}), 0)::int`,
                thisMonthRevenue: sql<number>`
                    COALESCE(SUM(CASE 
                        WHEN DATE(${bookings.createdAt}) >= DATE_TRUNC('month', CURRENT_DATE) 
                        THEN ${bookings.price} 
                    END), 0)::int
                `,
                lastMonthRevenue: sql<number>`
                    COALESCE(SUM(CASE 
                        WHEN DATE(${bookings.createdAt}) >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                        AND DATE(${bookings.createdAt}) < DATE_TRUNC('month', CURRENT_DATE)
                        THEN ${bookings.price} 
                    END), 0)::int
                `
            })
            .from(bookings)
            .innerJoin(packages, eq(bookings.packageId, packages.id))
            .innerJoin(programs, eq(packages.programId, programs.id))
            .where(and(
                eq(programs.academicId, academy.id),
                eq(bookings.status, 'success')
            ))

        return { data: revenue }
    } catch (error) {
        console.error('Error fetching revenue stats:', error)
        return { error: 'Failed to fetch revenue stats' }
    }
}) 