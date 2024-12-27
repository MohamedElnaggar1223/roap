'use server'

import { db } from '@/db'
import { programs, branches, branchTranslations, sports, sportTranslations, coachProgram, packages, schedules, coaches, discounts, packageDiscount } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, sql, inArray, asc, not } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { formatDateForDB } from '../utils'
import { CoachDetails, PackageDetails } from '../validations/bookings'
import { cookies } from 'next/headers'

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

    const programsData = await db.query.programs.findMany({
        where: eq(programs.academicId, academy.id),
        with: {
            packages: {
                with: {
                    schedules: true
                }
            },
            coachPrograms: {
                with: {
                    coach: {
                        columns: {
                            id: true,
                            name: true,
                            image: true
                        }
                    }
                }
            },
            branch: {
                with: {
                    branchTranslations: {
                        where: eq(branchTranslations.locale, 'en'),
                        columns: {
                            name: true
                        }
                    }
                }
            },
            sport: {
                with: {
                    sportTranslations: {
                        where: eq(sportTranslations.locale, 'en'),
                        columns: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: asc(programs.createdAt)
    })

    const finalProgramsData = programsData.map(program => ({
        ...program,
        name: program.name === 'Assessment' ? 'Assessment ' + program.sport?.sportTranslations[0]?.name + program.branch?.branchTranslations[0]?.name : program.name,
        packages: program.packages.map(pkg => ({
            ...pkg,
            schedules: pkg.schedules.map(s => ({
                ...s,
            }))
        })),
        coaches: program.coachPrograms.map(cp => ({
            ...cp.coach,
            image: cp.coach.image || ''
        })),
        branch: program.branch?.branchTranslations[0]?.name || '',
        sport: program.sport?.sportTranslations[0]?.name || ''
    }))

    console.log("Final Programs Data", finalProgramsData)

    const finalProgramsDataArray = birthday
        ? finalProgramsData.filter(program => {
            const birthDate = new Date(birthday);
            const startDate = program.startDateOfBirth ? new Date(program.startDateOfBirth) : null;
            const endDate = program.endDateOfBirth ? new Date(program.endDateOfBirth) : null;

            if (!startDate || !endDate) return true;

            return birthDate <= startDate && birthDate >= endDate;
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
            branchName: branchTranslations.name,
            sportName: sportTranslations.name,
            color: programs.color,
            coaches: sql<string[]>`(
                SELECT COALESCE(array_agg(coach_id), ARRAY[]::integer[])
                FROM ${coachProgram}
                WHERE ${coachProgram.programId} = ${programs.id}
            )`,
            packages: sql<string[]>`(
                SELECT COALESCE(array_agg(id), ARRAY[]::integer[])
                FROM ${packages}
                WHERE ${packages.programId} = ${programs.id}
            )`
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

    const transformedPrograms = programsData.map(program => ({
        ...program,
        coaches: program.coaches || [],
        packages: program.packages || [],
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

    await Promise.all(ids.map(async id =>
        await db.delete(programs).where(eq(programs.id, id))
    ))

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