'use server'

import { db } from '@/db'
import { programs, branches, branchTranslations, sports, sportTranslations, coachProgram, packages, schedules } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, sql, inArray, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { formatDateForDB } from '../utils'

export async function getPrograms() {
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
        .where(eq(programs.academicId, academy.id))
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
    type: "Term" | "Monthly" | "Full Season"
    termNumber?: number
    name: string
    price: number
    startDate: Date
    endDate: Date
    schedules: Schedule[]
    memo: string | null
    id?: number
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
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root' }
    }

    try {
        return await db.transaction(async (tx) => {
            const academy = await tx.query.academics.findFirst({
                where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
                columns: {
                    id: true,
                }
            })

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
                })
                .returning({
                    id: programs.id,
                })

            await Promise.all([
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

                data.packagesData.length > 0 ?
                    Promise.all(data.packagesData.map(async (packageData) => {
                        const [newPackage] = await tx
                            .insert(packages)
                            .values({
                                programId: program.id,
                                name: packageData.name,
                                price: packageData.price,
                                startDate: formatDateForDB(packageData.startDate),
                                endDate: formatDateForDB(packageData.endDate),
                                memo: packageData.memo,
                                sessionPerWeek: packageData.schedules.length,
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
    packagesData: Package[]
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root' }
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
                    updatedAt: sql`now()`
                })
                .where(eq(programs.id, id))

            const [currentCoaches, currentPackages] = await Promise.all([
                tx
                    .select({ coachId: coachProgram.coachId })
                    .from(coachProgram)
                    .where(eq(coachProgram.programId, id)),
                tx
                    .select({ packageId: packages.id })
                    .from(packages)
                    .where(eq(packages.programId, id))
            ])

            const currentCoachIds = currentCoaches.map(c => c.coachId)
            const coachesToAdd = data.coaches.filter(id => !currentCoachIds.includes(id))
            const coachesToRemove = currentCoachIds.filter(id => !data.coaches.includes(id))

            const currentPackageIds = currentPackages.map(p => p.packageId)
            const packagesToAdd = data.packagesData.filter(p => !p.id || !currentPackageIds.includes(p?.id))
            const packagesToRemove = currentPackageIds.filter(p => !data.packagesData.map(pd => pd.id).filter(pid => pid).includes(p))
            const packagesToUpdate = data.packagesData.filter(p => p.id && currentPackageIds.includes(p.id))

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
                        const [newPackage] = await tx
                            .insert(packages)
                            .values({
                                programId: id,
                                name: packageData.name,
                                price: packageData.price,
                                startDate: formatDateForDB(packageData.startDate),
                                endDate: formatDateForDB(packageData.endDate),
                                sessionPerWeek: packageData.schedules.length,
                                memo: packageData.memo,
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
                        await tx.transaction(async (innerTx) => {
                            await innerTx
                                .update(packages)
                                .set({
                                    name: packageData.name,
                                    price: packageData.price,
                                    startDate: formatDateForDB(packageData.startDate),
                                    endDate: formatDateForDB(packageData.endDate),
                                    sessionPerWeek: packageData.schedules.length,
                                    memo: packageData.memo,
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
            ])
        })

        revalidatePath('/academy/programs')
        return { success: true }

    } catch (error) {
        console.error('Error updating program:', error)
        return { error: 'Failed to update program' }
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