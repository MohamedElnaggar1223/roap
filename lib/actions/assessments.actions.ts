'use server'

import { db } from '@/db'
import { programs, branches, branchTranslations, sports, sportTranslations, coachProgram, packages, schedules } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, sql, asc, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { formatDateForDB } from '../utils'
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
}

interface Package {
    type: "Term" | "Monthly" | "Full Season" | 'Assessment' | 'Assessment'
    termNumber?: number
    name: string
    price: number
    startDate: string
    endDate: string
    schedules: Schedule[]
    memo: string | null
    id?: number
}

export async function getAssessments() {
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

    const assessmentData = await db
        .select({
            id: programs.id,
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
            assessmentDeductedFromProgram: programs.assessmentDeductedFromProgram,
            coaches: sql<string[]>`(
                SELECT COALESCE(array_agg(coach_id), ARRAY[]::integer[])
                FROM ${coachProgram}
                WHERE ${coachProgram.programId} = ${programs.id}
            )`,
            packages: sql<string[]>`(
                SELECT COALESCE(array_agg(id), ARRAY[]::integer[])
                FROM ${packages}
                WHERE ${packages.programId} = ${programs.id}
            )`,
            firstPackagePrice: sql<number>`(
                SELECT ${packages.price}
                FROM ${packages}
                WHERE ${packages.programId} = ${programs.id}
                AND ${packages.id} = ${packages.id}
                LIMIT 1
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
            eq(programs.name, 'Assessment')
        ))
        .orderBy(asc(programs.createdAt))

    const transformedAssessments = assessmentData.map(assessment => ({
        ...assessment,
        coaches: assessment.coaches || [],
        packages: assessment.packages || [],
    }))

    return {
        data: transformedAssessments,
        error: null
    }
}

export async function updateAssessment(id: number, data: {
    description: string
    branchId: number
    sportId: number
    // gender: string
    // startDateOfBirth: Date
    // endDateOfBirth: Date
    numberOfSeats: number
    coaches: number[]
    packagesData: Package[]
    assessmentDeductedFromProgram: boolean
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: 'You are not authorized to perform this action', field: null }
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
        return { error: 'You are not authorized to perform this action', field: null }
    }

    try {
        await db.transaction(async (tx) => {
            // Update the assessment program
            await tx
                .update(programs)
                .set({
                    description: data.description,
                    branchId: data.branchId,
                    sportId: data.sportId,
                    // gender: data.gender,
                    // startDateOfBirth: formatDateForDB(data.startDateOfBirth),
                    // endDateOfBirth: formatDateForDB(data.endDateOfBirth),
                    numberOfSeats: data.numberOfSeats,
                    type: 'TEAM',
                    assessmentDeductedFromProgram: data.assessmentDeductedFromProgram,
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
                                startDate: packageData.startDate,
                                endDate: packageData.endDate,
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
                                        startDateOfBirth: schedule.startDateOfBirth,
                                        endDateOfBirth: schedule.endDateOfBirth,
                                        gender: schedule.gender,
                                        capacity: schedule.capacity ?? 9999,
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
                                    startDate: packageData.startDate,
                                    endDate: packageData.endDate,
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
                                            startDateOfBirth: schedule.startDateOfBirth,
                                            endDateOfBirth: schedule.endDateOfBirth,
                                            gender: schedule.gender,
                                            capacity: schedule.capacity ?? 9999,
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
        return { success: true, field: null, error: null }

    } catch (error) {
        console.error('Error updating assessment:', error)
        return { error: 'Failed to update assessment', field: null }
    }
}