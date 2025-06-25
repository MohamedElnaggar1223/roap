'use server'

import { db } from '@/db'
import { programs, branches, branchTranslations, sports, sportTranslations, coachProgram, packages, schedules, coaches, discounts, packageDiscount, entryFeesHistory } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, sql, inArray, asc, not } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { formatDateForDB } from '../utils'
import { CoachDetails, PackageDetails } from '../validations/bookings'
import { cookies } from 'next/headers'
import { Program } from '@/stores/programs-store'


export const getProgramsDataStore = async (): Promise<{
    error: string | null;
    field: string | null;
    data: Program[];
}> => {
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
        return { error: 'Academy not found', data: [], field: null }
    }

    // OPTIMIZED: Use our new indexes and reduce nested queries
    const programsData = await db.query.programs.findMany({
        where: and(
            eq(programs.academicId, academy.id),
            not(eq(programs.name, 'Assessment'))
        ),
        with: {
            packages: {
                with: {
                    schedules: true
                }
            },
            coachPrograms: {
                columns: {
                    id: true,
                },
                with: {
                    coach: {
                        columns: {
                            id: true,
                        }
                    }
                }
            },
            discounts: {
                with: {
                    packageDiscounts: {
                        columns: {
                            packageId: true
                        }
                    }
                }
            }
        },
        orderBy: asc(programs.createdAt)
    })

    // Transform packages to include type field derived from name
    const transformedProgramsData = programsData.map(program => ({
        ...program,
        packages: program.packages.map(pkg => ({
            ...pkg,
            type: (pkg.name.startsWith('Assessment') ? 'Assessment' :
                pkg.name.startsWith('Term') ? 'Term' :
                    pkg.name.includes('Monthly') ? 'Monthly' : 'Full Season') as "Term" | "Monthly" | "Full Season" | "Assessment"
        }))
    }));

    return { data: transformedProgramsData, error: null, field: null }
}

export const getProgramsData = async (birthday?: string) => {
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
        return { error: 'Academy not found' }
    }

    // const programsData = await db
    //     .select({
    //         id: programs.id,
    //         name: programs.name,
    //         branch: branchTranslations.name,
    //         sport: sportTranslations.name,
    //         packages: sql<PackageDetails[]>`(
    //             SELECT id, name, price, entry_fees as entryFees, session_per_week as sessionPerWeek, session_duration as sessionDuration
    //             FROM ${packages}
    //             WHERE ${packages.programId} = ${programs.id}
    //         )`,
    //         coaches: sql<CoachDetails[]>`(
    //             SELECT id, name, image
    //             FROM ${coaches}
    //             WHERE ${coaches.academicId} = ${academy.id}
    //         )`
    //     })
    //     .from(programs)
    //     .innerJoin(branches, eq(programs.branchId, branches.id))
    //     .innerJoin(branchTranslations, and(
    //         eq(branches.id, branchTranslations.branchId),
    //         eq(branchTranslations.locale, 'en')
    //     ))
    //     .innerJoin(sports, eq(programs.sportId, sports.id))
    //     .innerJoin(sportTranslations, and(
    //         eq(sports.id, sportTranslations.sportId),
    //         eq(sportTranslations.locale, 'en')
    //     ))
    //     .where(and(
    //         eq(programs.academicId, academy.id),
    //         not(eq(programs.name, 'Assessment'))
    //     ))
    //     .orderBy(asc(programs.createdAt))

    // OPTIMIZED: Use more efficient query structure with our new indexes
    const programsData = await db
        .select({
            id: programs.id,
            name: programs.name,
            description: programs.description,
            academicId: programs.academicId,
            branchId: programs.branchId,
            sportId: programs.sportId,
            gender: programs.gender,
            startDateOfBirth: programs.startDateOfBirth,
            endDateOfBirth: programs.endDateOfBirth,
            startAgeMonths: programs.startAgeMonths,
            endAgeMonths: programs.endAgeMonths,
            isEndAgeUnlimited: programs.isEndAgeUnlimited,
            numberOfSeats: programs.numberOfSeats,
            type: programs.type,
            color: programs.color,
            createdAt: programs.createdAt,
            updatedAt: programs.updatedAt,
            branchName: branchTranslations.name,
            sportName: sportTranslations.name,
        })
        .from(programs)
        .innerJoin(branches, eq(programs.branchId, branches.id))
        .innerJoin(branchTranslations, and(
            eq(branches.id, branchTranslations.branchId),
            eq(branchTranslations.locale, 'en')
        ))
        .innerJoin(sports, eq(programs.sportId, sports.id))
        .innerJoin(sportTranslations, and(
            eq(sports.id, sportTranslations.sportId),
            eq(sportTranslations.locale, 'en')
        ))
        .where(eq(programs.academicId, academy.id))
        .orderBy(asc(programs.createdAt))

    // OPTIMIZED: Get packages and schedules separately to avoid N+1
    const programIds = programsData.map(p => p.id)
    let packagesData: any[] = []
    let schedulesData: any[] = []
    let coachProgramsData: any[] = []

    if (programIds.length > 0) {
        [packagesData, schedulesData, coachProgramsData] = await Promise.all([
            // Get all packages for these programs
            db.select()
                .from(packages)
                .where(inArray(packages.programId, programIds))
                .orderBy(asc(packages.createdAt)),

            // Get all schedules for packages (will join with packages below)
            db.select({
                id: schedules.id,
                packageId: schedules.packageId,
                day: schedules.day,
                from: schedules.from,
                to: schedules.to,
                memo: schedules.memo,
                startDateOfBirth: schedules.startDateOfBirth,
                endDateOfBirth: schedules.endDateOfBirth,
                startAgeMonths: schedules.startAgeMonths,
                endAgeMonths: schedules.endAgeMonths,
                isEndAgeUnlimited: schedules.isEndAgeUnlimited,
                gender: schedules.gender,
                capacity: schedules.capacity,
                hidden: schedules.hidden,
                createdAt: schedules.createdAt,
                updatedAt: schedules.updatedAt,
            })
                .from(schedules)
                .innerJoin(packages, eq(schedules.packageId, packages.id))
                .where(inArray(packages.programId, programIds)),

            // Get coach programs
            db.select({
                programId: coachProgram.programId,
                coachId: coachProgram.coachId,
                coachName: coaches.name,
                coachImage: coaches.image,
            })
                .from(coachProgram)
                .innerJoin(coaches, eq(coachProgram.coachId, coaches.id))
                .where(inArray(coachProgram.programId, programIds))
        ])
    }

    // OPTIMIZED: Build data structure efficiently using maps for O(1) lookups
    const packagesByProgram = packagesData.reduce((acc, pkg) => {
        if (!acc[pkg.programId]) acc[pkg.programId] = []
        acc[pkg.programId].push(pkg)
        return acc
    }, {} as Record<number, any[]>)

    const schedulesByPackage = schedulesData.reduce((acc, schedule) => {
        if (!acc[schedule.packageId]) acc[schedule.packageId] = []
        acc[schedule.packageId].push(schedule)
        return acc
    }, {} as Record<number, any[]>)

    const coachesByProgram = coachProgramsData.reduce((acc, cp) => {
        if (!acc[cp.programId]) acc[cp.programId] = []
        acc[cp.programId].push({
            id: cp.coachId,
            name: cp.coachName,
            image: cp.coachImage || ''
        })
        return acc
    }, {} as Record<number, any[]>)

    const finalProgramsData = programsData.map(program => ({
        ...program,
        name: program.name === 'Assessment' ? 'Assessment ' + program.sportName + program.branchName : program.name,
        packages: (packagesByProgram[program.id] || []).map((pkg: any) => ({
            ...pkg,
            type: (pkg.name.startsWith('Assessment') ? 'Assessment' :
                pkg.name.startsWith('Term') ? 'Term' :
                    pkg.name.includes('Monthly') ? 'Monthly' : 'Full Season') as "Term" | "Monthly" | "Full Season" | "Assessment",
            schedules: schedulesByPackage[pkg.id] || []
        })),
        coaches: coachesByProgram[program.id] || [],
        branch: program.branchName,
        sport: program.sportName
    }))

    console.log("Final Programs Data", finalProgramsData)

    const finalProgramsDataArray = birthday
        ? finalProgramsData.filter(program => {
            const birthDate = new Date(birthday);
            const startDate = program.startDateOfBirth ? new Date(program.startDateOfBirth) : null;
            const endDate = program.endDateOfBirth ? new Date(program.endDateOfBirth) : null;

            if (!startDate || !endDate) return true;

            return birthDate >= startDate && birthDate <= endDate;
        })
        : finalProgramsData

    if (finalProgramsDataArray.length === 0 && finalProgramsData.length > 0) {
        return {
            data: [],
            error: 'No programs found for the selected athlete'
        }
    }

    console.log("Final Programs Data Array", finalProgramsDataArray)

    return {
        data: finalProgramsDataArray,
        error: null
    }
}

export async function getPrograms() {
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
        return { error: 'Academy not found' }
    }

    // OPTIMIZED: Use parallel queries instead of complex subqueries
    const programsData = await db
        .select({
            id: programs.id,
            name: programs.name,
            description: programs.description,
            type: programs.type,
            numberOfSeats: programs.numberOfSeats,
            branchId: programs.branchId,
            sportId: programs.sportId,
            gender: programs.gender,
            startDateOfBirth: programs.startDateOfBirth,
            endDateOfBirth: programs.endDateOfBirth,
            startAgeMonths: programs.startAgeMonths,
            endAgeMonths: programs.endAgeMonths,
            isEndAgeUnlimited: programs.isEndAgeUnlimited,
            branchName: branchTranslations.name,
            sportName: sportTranslations.name,
            color: programs.color,
        })
        .from(programs)
        .innerJoin(branches, eq(programs.branchId, branches.id))
        .innerJoin(branchTranslations, and(
            eq(branches.id, branchTranslations.branchId),
            eq(branchTranslations.locale, 'en')
        ))
        .innerJoin(sports, eq(programs.sportId, sports.id))
        .innerJoin(sportTranslations, and(
            eq(sports.id, sportTranslations.sportId),
            eq(sportTranslations.locale, 'en')
        ))
        .where(and(
            eq(programs.academicId, academy.id),
            not(eq(programs.name, 'Assessment'))
        ))
        .orderBy(asc(programs.createdAt))

    // OPTIMIZED: Get coaches and packages separately with our new indexes
    const programIds = programsData.map(p => p.id)
    let coachesData: any[] = []
    let packagesData: any[] = []

    if (programIds.length > 0) {
        [coachesData, packagesData] = await Promise.all([
            db.select({
                programId: coachProgram.programId,
                coachId: coachProgram.coachId,
            })
                .from(coachProgram)
                .where(inArray(coachProgram.programId, programIds)),

            db.select({
                programId: packages.programId,
                id: packages.id,
            })
                .from(packages)
                .where(inArray(packages.programId, programIds))
        ])
    }

    // OPTIMIZED: Build lookup maps for efficient data assembly
    const coachesByProgram = coachesData.reduce((acc, coach) => {
        if (!acc[coach.programId]) acc[coach.programId] = []
        acc[coach.programId].push(coach.coachId)
        return acc
    }, {} as Record<number, number[]>)

    const packagesByProgram = packagesData.reduce((acc, pkg) => {
        if (!acc[pkg.programId]) acc[pkg.programId] = []
        acc[pkg.programId].push(pkg.id)
        return acc
    }, {} as Record<number, number[]>)

    const transformedPrograms = programsData.map(program => ({
        ...program,
        coaches: coachesByProgram[program.id] || [],
        packages: packagesByProgram[program.id] || [],
    }))

    return {
        data: transformedPrograms,
        error: null
    }
}

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
}

interface Package {
    type: "Term" | "Monthly" | "Full Season" | 'Assessment'
    termNumber?: number
    name: string
    price: number
    startDate: Date
    endDate: Date
    schedules: Schedule[]
    memo: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    id?: number
    months?: string[] | null
    sessionDuration?: number | null
    capacity?: number | null
    flexible?: boolean | null
}
interface ProgramDiscountData {
    id?: number
    type: 'fixed' | 'percentage'
    value: number
    startDate: Date
    endDate: Date
    packageIds: number[]
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

export async function createProgramStore(program: Program): Promise<{
    error: string | null;
    field: string | null;
    data: { id: number } | null;
}> {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null, data: null }
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
        return { error: 'You are not authorized to perform this action', field: null, data: null }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academy) {
        return { error: 'Academy not found', field: 'root', data: null }
    }

    try {
        const { data, error, field } = await db.transaction(async (tx) => {
            // Create program
            const [newProgram] = await tx
                .insert(programs)
                .values({
                    name: program.name,
                    description: program.description,
                    branchId: program.branchId,
                    sportId: program.sportId,
                    gender: program.gender,
                    flexible: program.flexible,
                    startDateOfBirth: formatDateForDB(new Date(program.startDateOfBirth ?? '') ?? new Date()),
                    endDateOfBirth: formatDateForDB(new Date(program.endDateOfBirth ?? '') ?? new Date()),
                    startAgeMonths: program.startAgeMonths,
                    endAgeMonths: program.endAgeMonths,
                    isEndAgeUnlimited: program.isEndAgeUnlimited ?? false,
                    numberOfSeats: program.numberOfSeats,
                    type: program.type,
                    updatedAt: sql`now()`,
                    createdAt: sql`now()`,
                    color: program.color,
                    academicId: academy.id,
                })
                .returning({
                    id: programs.id
                })
            console.log("Program Id", newProgram.id)

            // Create packages
            await Promise.all([
                // Handle coaches
                program.coachPrograms.length > 0 ?
                    tx.insert(coachProgram)
                        .values(
                            program.coachPrograms.map(cp => ({
                                programId: newProgram.id,
                                coachId: cp.coach.id,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                program.packages.length > 0 ?
                    Promise.all(program.packages.map(async (packageData) => {
                        let startDate = packageData.startDate;
                        let endDate = packageData.endDate;

                        const isMonthly = packageData.name.toLowerCase().startsWith('monthly');

                        if (isMonthly && packageData.months && packageData.months.length > 0) {
                            const dates = getFirstAndLastDayOfMonths(packageData.months);
                            startDate = formatDateForDB(dates.startDate);
                            endDate = formatDateForDB(dates.endDate);
                        }

                        const [newPackage] = await tx
                            .insert(packages)
                            .values({
                                programId: newProgram.id,
                                name: packageData.name,
                                price: packageData.price,
                                startDate: startDate,
                                endDate: endDate,
                                months: isMonthly ? packageData.months : null,
                                sessionPerWeek: packageData.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                                sessionDuration: packageData.flexible ? (packageData.sessionDuration ?? 0) : 0,
                                capacity: packageData.flexible ? null : packageData.capacity,
                                flexible: packageData.flexible,
                                memo: packageData.memo,
                                entryFees: packageData.entryFees ?? 0,
                                entryFeesStartDate: packageData.entryFeesStartDate,
                                entryFeesEndDate: packageData.entryFeesEndDate,
                                entryFeesExplanation: packageData.entryFeesExplanation,
                                entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || null,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: packages.id
                            })

                        if (packageData.schedules.length > 0) {
                            await tx.insert(schedules)
                                .values(
                                    packageData.schedules.map(schedule => ({
                                        packageId: newPackage.id,
                                        day: schedule.day,
                                        from: schedule.from,
                                        to: schedule.to,
                                        memo: schedule.memo,
                                        capacity: schedule.capacity ?? 0,
                                        hidden: schedule.hidden ?? false,
                                        createdAt: sql`now()`,
                                        updatedAt: sql`now()`,
                                    }))
                                )
                        }
                    })) : Promise.resolve(),

                // Handle discounts
                program.discounts.length > 0 ?
                    Promise.all(program.discounts.map(async (discountData) => {
                        const [newDiscount] = await tx
                            .insert(discounts)
                            .values({
                                programId: newProgram.id,
                                type: discountData.type,
                                value: discountData.value,
                                startDate: formatDateForDB(new Date(discountData.startDate)),
                                endDate: formatDateForDB(new Date(discountData.endDate)),
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: discounts.id
                            })

                        if (discountData.packageDiscounts.length > 0) {
                            await tx.insert(packageDiscount)
                                .values(
                                    discountData.packageDiscounts.map(pd => ({
                                        packageId: pd.packageId,
                                        discountId: newDiscount.id,
                                        createdAt: sql`now()`,
                                        updatedAt: sql`now()`,
                                    }))
                                )
                        }
                    })) : Promise.resolve()
            ])

            return { data: newProgram, field: null, error: null }
        })

        return { data, error, field }
    }
    catch (error) {
        console.error('Error creating program:', error)
        return { error: 'Failed to create program', field: null, data: null }
    }
}

export async function createProgram(data: {
    name: string
    description: string
    branchId: number
    sportId: number
    gender: string
    startDateOfBirth: Date
    endDateOfBirth: Date
    numberOfSeats: number
    type: string
    coaches: number[]
    packagesData: Package[]
    color: string
    discountsData: ProgramDiscountData[]
}) {
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

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    try {
        return await db.transaction(async (tx) => {
            if (!academy) return { error: 'Academy not found', field: 'root' }

            const [program] = await tx
                .insert(programs)
                .values({
                    name: data.name,
                    description: data.description,
                    branchId: data.branchId,
                    sportId: data.sportId,
                    gender: data.gender,
                    startDateOfBirth: formatDateForDB(data.startDateOfBirth),
                    endDateOfBirth: formatDateForDB(data.endDateOfBirth),
                    numberOfSeats: data.numberOfSeats,
                    type: data.type,
                    academicId: academy.id,
                    color: data.color,
                })
                .returning({
                    id: programs.id,
                })

            await Promise.all([
                // Handle coaches
                data.coaches.length > 0 ?
                    tx.insert(coachProgram)
                        .values(
                            data.coaches.map(coachId => ({
                                programId: program.id,
                                coachId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                // Handle packages
                data.packagesData.length > 0 ?
                    Promise.all(data.packagesData.map(async (packageData) => {
                        // For Monthly packages, calculate start and end dates from months
                        let startDate = packageData.startDate;
                        let endDate = packageData.endDate;

                        if (packageData.type === 'Monthly' && packageData.months && packageData.months.length > 0) {
                            const dates = getFirstAndLastDayOfMonths(packageData.months);
                            startDate = dates.startDate;
                            endDate = dates.endDate;
                        }

                        const [newPackage] = await tx
                            .insert(packages)
                            .values({
                                programId: program.id,
                                name: packageData.name,
                                price: packageData.price,
                                startDate: formatDateForDB(startDate),
                                endDate: formatDateForDB(endDate),
                                months: packageData.type === 'Monthly' ? packageData.months : null,
                                memo: packageData.memo,
                                sessionPerWeek: packageData.schedules.length,
                                entryFees: packageData.entryFees ?? 0,
                                entryFeesExplanation: packageData.entryFeesExplanation,
                                entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || null,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: packages.id
                            })

                        if (packageData.schedules.length > 0) {
                            await tx.insert(schedules)
                                .values(
                                    packageData.schedules.map(schedule => ({
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
                    })) : Promise.resolve(),

                // Handle discounts
                data.discountsData.length > 0 ?
                    Promise.all(data.discountsData.map(async (discountData) => {
                        const [newDiscount] = await tx
                            .insert(discounts)
                            .values({
                                programId: program.id,
                                type: discountData.type,
                                value: discountData.value,
                                startDate: formatDateForDB(discountData.startDate),
                                endDate: formatDateForDB(discountData.endDate),
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: discounts.id
                            })

                        if (discountData.packageIds.length > 0) {
                            await tx.insert(packageDiscount)
                                .values(
                                    discountData.packageIds.map(packageId => ({
                                        packageId,
                                        discountId: newDiscount.id,
                                        createdAt: sql`now()`,
                                        updatedAt: sql`now()`,
                                    }))
                                )
                        }
                    })) : Promise.resolve()
            ])

            return { data: program, success: true, error: null }
        })
    } catch (error) {
        console.error('Error creating program:', error)
        return { error: 'Failed to create program' }
    }
    finally {
        revalidatePath('/academy/programs')
    }
}

export async function updateProgramStore(program: Program, oldProgram: Program) {
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

    try {
        await db.transaction(async (tx) => {
            await tx
                .update(programs)
                .set({
                    name: program.name,
                    description: program.description,
                    branchId: program.branchId,
                    sportId: program.sportId,
                    gender: program.gender,
                    flexible: program.flexible,
                    startDateOfBirth: formatDateForDB(new Date(program.startDateOfBirth ?? '') ?? new Date()),
                    endDateOfBirth: formatDateForDB(new Date(program.endDateOfBirth ?? '') ?? new Date()),
                    startAgeMonths: program.startAgeMonths,
                    endAgeMonths: program.endAgeMonths,
                    isEndAgeUnlimited: program.isEndAgeUnlimited ?? false,
                    numberOfSeats: program.numberOfSeats,
                    type: program.type,
                    updatedAt: sql`now()`,
                    color: program.color,
                    hidden: program.hidden ?? false
                })
                .where(eq(programs.id, program.id))

            const currentCoaches = program.coachPrograms
            const currentPackages = oldProgram.packages
            const currentDiscounts = oldProgram.discounts

            const currentCoachIds = currentCoaches.filter(c => c.id !== undefined).map(c => c.id as number)
            const coachesToAdd = currentCoaches.filter(c => !c.id).map(c => c.coach.id)
            const coachesToRemove = currentCoaches.filter(c => c.deleted).filter(c => !!c.id).map(c => c.coach.id as number)

            const currentPackageIds = currentPackages.filter(p => p.id !== undefined).map(p => p.id as number)
            const packagesToAdd = program.packages.filter(p => !p.id || !currentPackageIds.includes(p?.id))
            const packagesToRemove = program.packages.filter(p => p.deleted).filter(p => !!p.id).map(p => p.id as number)
            const packagesToUpdate = program.packages.filter(p => p.id && currentPackageIds.includes(p.id) && !p.deleted)

            console.log("Current Coaches", currentCoaches)
            console.log("Coaches to remove", coachesToRemove)

            const currentDiscountIds = currentDiscounts.filter(d => d.id !== undefined).map(d => d.id as number)
            const discountsToAdd = program.discounts.filter(d => !d.id || !currentDiscountIds.includes(d.id))
            const discountsToRemove = currentDiscountIds.filter(d => !program.discounts.map(dd => dd.id).filter(did => did).includes(d))
            const discountsToUpdate = program.discounts.filter(d => d.id && currentDiscountIds.includes(d.id))

            console.log("Discounts to add", discountsToAdd)

            await Promise.all([
                coachesToRemove.length > 0 ?
                    tx.delete(coachProgram)
                        .where(and(
                            eq(coachProgram.programId, program.id),
                            inArray(coachProgram.coachId, coachesToRemove)
                        )) : Promise.resolve(),

                coachesToAdd.length > 0 ?
                    tx.insert(coachProgram)
                        .values(coachesToAdd.map(coachId => ({
                            programId: program.id,
                            coachId,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))) : Promise.resolve(),

                packagesToAdd.length > 0 ?
                    Promise.all(packagesToAdd.map(async (packageData) => {
                        let startDate = packageData.startDate;
                        let endDate = packageData.endDate;

                        const isMonthly = packageData.name.toLowerCase().startsWith('monthly');

                        if (isMonthly && packageData.months && packageData.months.length > 0) {
                            const dates = getFirstAndLastDayOfMonths(packageData.months);
                            startDate = formatDateForDB(dates.startDate);
                            endDate = formatDateForDB(dates.endDate);
                        }

                        const [newPackage] = await tx
                            .insert(packages)
                            .values({
                                programId: program.id,
                                name: packageData.name,
                                price: packageData.price,
                                startDate: startDate,
                                endDate: endDate,
                                months: isMonthly ? packageData.months : null,
                                sessionPerWeek: packageData.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                                sessionDuration: packageData.flexible ? (packageData.sessionDuration ?? 0) : 0,
                                capacity: packageData.flexible ? null : packageData.capacity,
                                flexible: packageData.flexible,
                                memo: packageData.memo,
                                entryFees: packageData.entryFees ?? 0,
                                entryFeesStartDate: packageData.entryFeesStartDate,
                                entryFeesEndDate: packageData.entryFeesEndDate,
                                entryFeesExplanation: packageData.entryFeesExplanation,
                                entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || null,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: packages.id
                            })

                        if (packageData.schedules.length > 0) {
                            await tx.insert(schedules)
                                .values(
                                    packageData.schedules.map(schedule => ({
                                        packageId: newPackage.id,
                                        day: schedule.day,
                                        from: schedule.from,
                                        to: schedule.to,
                                        memo: schedule.memo,
                                        hidden: schedule.hidden ?? false,
                                        capacity: schedule.capacity ?? 0,
                                        createdAt: sql`now()`,
                                        updatedAt: sql`now()`,
                                    }))
                                )
                        }
                    })) : Promise.resolve(),

                packagesToRemove.length > 0 ?
                    (async () => {
                        // First delete all schedules
                        await tx.delete(schedules)
                            .where(inArray(schedules.packageId, packagesToRemove))

                        // Then delete the packages
                        await tx.delete(packages)
                            .where(and(
                                eq(packages.programId, program.id),
                                inArray(packages.id, packagesToRemove)
                            ))
                    })() : Promise.resolve(),

                packagesToUpdate.length > 0 ?
                    Promise.all(packagesToUpdate.map(async (packageData) => {
                        let startDate = packageData.startDate;
                        let endDate = packageData.endDate;

                        const isMonthly = packageData.name.toLowerCase().startsWith('monthly');

                        if (isMonthly && packageData.months && packageData.months.length > 0) {
                            const dates = getFirstAndLastDayOfMonths(packageData.months);
                            startDate = formatDateForDB(dates.startDate);
                            endDate = formatDateForDB(dates.endDate);
                        }

                        await tx.transaction(async (innerTx) => {
                            await innerTx
                                .update(packages)
                                .set({
                                    name: packageData.name,
                                    price: packageData.price,
                                    startDate: startDate,
                                    endDate: endDate,
                                    capacity: packageData.flexible ? null : packageData.capacity,
                                    months: isMonthly ? packageData.months : null,
                                    sessionPerWeek: packageData.flexible ? packageData.sessionPerWeek : packageData.schedules.length,
                                    sessionDuration: packageData.flexible ? packageData.sessionDuration : null,
                                    flexible: packageData.flexible,
                                    memo: packageData.memo,
                                    entryFees: packageData.entryFees ?? 0,
                                    entryFeesStartDate: packageData.entryFeesStartDate,
                                    entryFeesEndDate: packageData.entryFeesEndDate,
                                    entryFeesExplanation: packageData.entryFeesExplanation,
                                    entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || null,
                                    hidden: packageData.hidden ?? false
                                })
                                .where(eq(packages.id, packageData.id!))

                            await innerTx
                                .delete(schedules)
                                .where(eq(schedules.packageId, packageData.id!))

                            if (packageData.schedules.length > 0) {
                                await innerTx
                                    .insert(schedules)
                                    .values(
                                        packageData.schedules.map(schedule => ({
                                            packageId: packageData.id!,
                                            day: schedule.day,
                                            from: schedule.from,
                                            to: schedule.to,
                                            memo: schedule.memo,
                                            capacity: schedule.capacity ?? 0,
                                            createdAt: sql`now()`,
                                            updatedAt: sql`now()`,
                                            hidden: schedule.hidden ?? false,
                                        }))
                                    )
                            }
                        })
                    })) : Promise.resolve(),
                discountsToRemove.length > 0 ?
                    tx.delete(discounts)
                        .where(and(
                            eq(discounts.programId, program.id),
                            inArray(discounts.id, discountsToRemove)
                        )) : Promise.resolve(),

                // Handle new discounts
                discountsToAdd.length > 0 ?
                    Promise.all(discountsToAdd.map(async (discountData) => {
                        const [newDiscount] = await tx
                            .insert(discounts)
                            .values({
                                programId: program.id,
                                type: discountData.type,
                                value: discountData.value,
                                startDate: formatDateForDB(new Date(discountData.startDate)),
                                endDate: formatDateForDB(new Date(discountData.endDate)),
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: discounts.id
                            })

                        if (discountData.packageDiscounts.length > 0) {
                            await tx.insert(packageDiscount)
                                .values(
                                    discountData.packageDiscounts.map(pD => ({
                                        packageId: pD.packageId,
                                        discountId: newDiscount.id,
                                        createdAt: sql`now()`,
                                        updatedAt: sql`now()`,
                                    }))
                                )
                        }
                    })) : Promise.resolve(),

                // Handle discount updates
                discountsToUpdate.length > 0 ?
                    Promise.all(discountsToUpdate.map(async (discountData) => {
                        await tx.transaction(async (innerTx) => {
                            await innerTx
                                .update(discounts)
                                .set({
                                    type: discountData.type,
                                    value: discountData.value,
                                    startDate: formatDateForDB(new Date(discountData.startDate)),
                                    endDate: formatDateForDB(new Date(discountData.endDate)),
                                    updatedAt: sql`now()`,
                                })
                                .where(eq(discounts.id, discountData.id!))

                            // Update package associations
                            await innerTx
                                .delete(packageDiscount)
                                .where(eq(packageDiscount.discountId, discountData.id!))

                            if (discountData.packageDiscounts.length > 0) {
                                await innerTx
                                    .insert(packageDiscount)
                                    .values(
                                        discountData.packageDiscounts.map(pD => ({
                                            packageId: pD.packageId,
                                            discountId: discountData.id!,
                                            createdAt: sql`now()`,
                                            updatedAt: sql`now()`,
                                        }))
                                    )
                            }
                        })
                    })) : Promise.resolve(),
            ])
        })
    }
    catch (error) {
        console.error('Error updating program:', error)
        return { error: 'Failed to update program' }
    }
}

export async function updateProgram(id: number, data: {
    name: string
    description: string
    branchId: number
    sportId: number
    gender: string
    startDateOfBirth: Date
    endDateOfBirth: Date
    numberOfSeats: number
    type: string
    coaches: number[]
    color: string
    packagesData: Package[]
    discountsData: ProgramDiscountData[]
}) {
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

    try {
        await db.transaction(async (tx) => {
            await tx
                .update(programs)
                .set({
                    name: data.name,
                    description: data.description,
                    branchId: data.branchId,
                    sportId: data.sportId,
                    gender: data.gender,
                    startDateOfBirth: formatDateForDB(data.startDateOfBirth),
                    endDateOfBirth: formatDateForDB(data.endDateOfBirth),
                    numberOfSeats: data.numberOfSeats,
                    type: data.type,
                    updatedAt: sql`now()`,
                    color: data.color,
                })
                .where(eq(programs.id, id))

            const [currentCoaches, currentPackages, currentDiscounts] = await Promise.all([
                tx
                    .select({ coachId: coachProgram.coachId })
                    .from(coachProgram)
                    .where(eq(coachProgram.programId, id)),
                tx
                    .select({ packageId: packages.id })
                    .from(packages)
                    .where(eq(packages.programId, id)),
                tx
                    .select({ discountId: discounts.id })
                    .from(discounts)
                    .where(eq(discounts.programId, id))
            ])

            const currentCoachIds = currentCoaches.map(c => c.coachId)
            const coachesToAdd = data.coaches.filter(id => !currentCoachIds.includes(id))
            const coachesToRemove = currentCoachIds.filter(id => !data.coaches.includes(id))

            const currentPackageIds = currentPackages.map(p => p.packageId)
            const packagesToAdd = data.packagesData.filter(p => !p.id || !currentPackageIds.includes(p?.id))
            const packagesToRemove = currentPackageIds.filter(p => !data.packagesData.map(pd => pd.id).filter(pid => pid).includes(p))
            const packagesToUpdate = data.packagesData.filter(p => p.id && currentPackageIds.includes(p.id))

            const currentDiscountIds = currentDiscounts.map(d => d.discountId)
            const discountsToAdd = data.discountsData.filter(d => !d.id || !currentDiscountIds.includes(d.id))
            const discountsToRemove = currentDiscountIds.filter(d => !data.discountsData.map(dd => dd.id).filter(did => did).includes(d))
            const discountsToUpdate = data.discountsData.filter(d => d.id && currentDiscountIds.includes(d.id))

            await Promise.all([
                coachesToRemove.length > 0 ?
                    tx.delete(coachProgram)
                        .where(and(
                            eq(coachProgram.programId, id),
                            inArray(coachProgram.coachId, coachesToRemove)
                        )) : Promise.resolve(),

                coachesToAdd.length > 0 ?
                    tx.insert(coachProgram)
                        .values(coachesToAdd.map(coachId => ({
                            programId: id,
                            coachId,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))) : Promise.resolve(),

                packagesToAdd.length > 0 ?
                    Promise.all(packagesToAdd.map(async (packageData) => {
                        let startDate = packageData.startDate;
                        let endDate = packageData.endDate;

                        if (packageData.type === 'Monthly' && packageData.months && packageData.months.length > 0) {
                            const dates = getFirstAndLastDayOfMonths(packageData.months);
                            startDate = dates.startDate;
                            endDate = dates.endDate;
                        }

                        const [newPackage] = await tx
                            .insert(packages)
                            .values({
                                programId: id,
                                name: packageData.name,
                                price: packageData.price,
                                startDate: formatDateForDB(startDate),
                                endDate: formatDateForDB(endDate),
                                months: packageData.type === 'Monthly' ? packageData.months : null,
                                sessionPerWeek: packageData.schedules.length,
                                memo: packageData.memo,
                                entryFees: packageData.entryFees ?? 0,
                                entryFeesExplanation: packageData.entryFeesExplanation,
                                entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || null,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: packages.id
                            })

                        if (packageData.schedules.length > 0) {
                            await tx.insert(schedules)
                                .values(
                                    packageData.schedules.map(schedule => ({
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
                    })) : Promise.resolve(),

                packagesToRemove.length > 0 ?
                    tx.delete(packages)
                        .where(and(
                            eq(packages.programId, id),
                            inArray(packages.id, packagesToRemove)
                        )) : Promise.resolve(),

                packagesToUpdate.length > 0 ?
                    Promise.all(packagesToUpdate.map(async (packageData) => {
                        let startDate = packageData.startDate;
                        let endDate = packageData.endDate;

                        if (packageData.type === 'Monthly' && packageData.months && packageData.months.length > 0) {
                            const dates = getFirstAndLastDayOfMonths(packageData.months);
                            startDate = dates.startDate;
                            endDate = dates.endDate;
                        }

                        await tx.transaction(async (innerTx) => {
                            await innerTx
                                .update(packages)
                                .set({
                                    name: packageData.name,
                                    price: packageData.price,
                                    startDate: formatDateForDB(startDate),
                                    endDate: formatDateForDB(endDate),
                                    months: packageData.type === 'Monthly' ? packageData.months : null,
                                    sessionPerWeek: packageData.schedules.length,
                                    memo: packageData.memo,
                                    entryFees: packageData.entryFees ?? 0,
                                    entryFeesExplanation: packageData.entryFeesExplanation,
                                    entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || null,
                                    updatedAt: sql`now()`,
                                })
                                .where(eq(packages.id, packageData.id!))

                            await innerTx
                                .delete(schedules)
                                .where(eq(schedules.packageId, packageData.id!))

                            if (packageData.schedules.length > 0) {
                                await innerTx
                                    .insert(schedules)
                                    .values(
                                        packageData.schedules.map(schedule => ({
                                            packageId: packageData.id!,
                                            day: schedule.day,
                                            from: schedule.from,
                                            to: schedule.to,
                                            memo: schedule.memo,
                                            createdAt: sql`now()`,
                                            updatedAt: sql`now()`,
                                        }))
                                    )
                            }
                        })
                    })) : Promise.resolve(),
                discountsToRemove.length > 0 ?
                    tx.delete(discounts)
                        .where(and(
                            eq(discounts.programId, id),
                            inArray(discounts.id, discountsToRemove)
                        )) : Promise.resolve(),

                // Handle new discounts
                discountsToAdd.length > 0 ?
                    Promise.all(discountsToAdd.map(async (discountData) => {
                        const [newDiscount] = await tx
                            .insert(discounts)
                            .values({
                                programId: id,
                                type: discountData.type,
                                value: discountData.value,
                                startDate: formatDateForDB(discountData.startDate),
                                endDate: formatDateForDB(discountData.endDate),
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            })
                            .returning({
                                id: discounts.id
                            })

                        if (discountData.packageIds.length > 0) {
                            await tx.insert(packageDiscount)
                                .values(
                                    discountData.packageIds.map(packageId => ({
                                        packageId,
                                        discountId: newDiscount.id,
                                        createdAt: sql`now()`,
                                        updatedAt: sql`now()`,
                                    }))
                                )
                        }
                    })) : Promise.resolve(),

                // Handle discount updates
                discountsToUpdate.length > 0 ?
                    Promise.all(discountsToUpdate.map(async (discountData) => {
                        await tx.transaction(async (innerTx) => {
                            await innerTx
                                .update(discounts)
                                .set({
                                    type: discountData.type,
                                    value: discountData.value,
                                    startDate: formatDateForDB(discountData.startDate),
                                    endDate: formatDateForDB(discountData.endDate),
                                    updatedAt: sql`now()`,
                                })
                                .where(eq(discounts.id, discountData.id!))

                            // Update package associations
                            await innerTx
                                .delete(packageDiscount)
                                .where(eq(packageDiscount.discountId, discountData.id!))

                            if (discountData.packageIds.length > 0) {
                                await innerTx
                                    .insert(packageDiscount)
                                    .values(
                                        discountData.packageIds.map(packageId => ({
                                            packageId,
                                            discountId: discountData.id!,
                                            createdAt: sql`now()`,
                                            updatedAt: sql`now()`,
                                        }))
                                    )
                            }
                        })
                    })) : Promise.resolve(),
            ])
        })

        revalidatePath('/academy/programs')
        return { success: true, field: null }

    } catch (error) {
        console.error('Error updating program:', error)
        return { error: 'Failed to update program', field: null }
    }
}

export async function deletePrograms(ids: number[]) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    await db.transaction(async (tx) => {
        for (const id of ids) {
            // First delete related entry fees history records
            await tx
                .delete(entryFeesHistory)
                .where(eq(entryFeesHistory.programId, id));

            // Then delete the program
            await tx
                .delete(programs)
                .where(eq(programs.id, id));
        }
    });

    revalidatePath('/academy/programs')
    return { success: true }
}

export async function createPackage(programId: number, data: {
    name: string
    price: number
    startDate: Date
    endDate: Date
    sessionPerWeek: number
    sessionDuration: number | null
    memo?: string | null
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        const [newPackage] = await db
            .insert(packages)
            .values({
                ...data,
                startDate: formatDateForDB(data.startDate),
                endDate: formatDateForDB(data.endDate),
                programId,
                createdAt: sql`now()`,
                updatedAt: sql`now()`,
            })
            .returning({
                id: packages.id,
            })

        revalidatePath('/academy/programs')
        return { data: newPackage }
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
    sessionPerWeek: number
    sessionDuration: number | null
    memo?: string | null
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        await db
            .update(packages)
            .set({
                ...data,
                startDate: formatDateForDB(data.startDate),
                endDate: formatDateForDB(data.endDate),
                updatedAt: sql`now()`
            })
            .where(eq(packages.id, id))

        revalidatePath('/academy/programs')
        return { success: true }
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