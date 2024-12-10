'use server'

import { db } from '@/db'
import { branches, branchTranslations, branchFacility, branchSport, coaches, coachSpokenLanguage, coachSport, packages, programs, coachProgram, schedules, academics } from '@/db/schema'
import { auth } from '@/auth'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidatePath, revalidateTag } from 'next/cache'
import { formatDateForDB } from '../utils'

interface OnboardingLocationData {
    name: string
    nameInGoogleMap: string
    url: string
    sports: number[]
    facilities: number[]
    latitude?: string
    longitude?: string
}

export const createOnboardingLocation = async (data: OnboardingLocationData) => {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) return { error: 'Academy not found' }

    try {
        return await db.transaction(async (tx) => {
            // Create branch (always default for onboarding)
            const [branch] = await tx
                .insert(branches)
                .values({
                    academicId: academic.id,
                    slug: data.name.toLowerCase().replace(/\s+/g, '-'),
                    nameInGoogleMap: data.nameInGoogleMap,
                    url: data.url,
                    isDefault: true,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`,
                    latitude: data.latitude,
                    longitude: data.longitude,
                })
                .returning({
                    id: branches.id,
                })

            // Add translation
            await tx
                .insert(branchTranslations)
                .values({
                    branchId: branch.id,
                    locale: 'en',
                    name: data.name,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`,
                })

            // Add sports
            if (data.sports.length) {
                await tx
                    .insert(branchSport)
                    .values(
                        data.sports.map(sportId => ({
                            branchId: branch.id,
                            sportId,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))
                    )
            }

            // Add facilities
            if (data.facilities.length) {
                await tx
                    .insert(branchFacility)
                    .values(
                        data.facilities.map(facilityId => ({
                            branchId: branch.id,
                            facilityId,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))
                    )
            }

            revalidatePath('/on-boarding/location')
            return { success: true, error: null }
        })
    } catch (error) {
        console.error('Error creating onboarding location:', error)
        return { error: 'Failed to create location' }
    }
    finally {
        revalidateTag(`locations-${academic?.id.toString()}`)
    }
}

export const updateOnboardingLocation = async (id: number, data: OnboardingLocationData) => {
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

    try {
        await db.transaction(async (tx) => {
            // Update branch
            await tx
                .update(branches)
                .set({
                    nameInGoogleMap: data.nameInGoogleMap,
                    url: data.url,
                    updatedAt: sql`now()`,
                    latitude: data.latitude,
                    longitude: data.longitude,
                })
                .where(eq(branches.id, id))

            // Update translation
            await tx
                .update(branchTranslations)
                .set({
                    name: data.name,
                    updatedAt: sql`now()`,
                })
                .where(and(
                    eq(branchTranslations.branchId, id),
                    eq(branchTranslations.locale, 'en')
                ))

            // Update sports (clear and recreate)
            await tx.delete(branchSport).where(eq(branchSport.branchId, id))
            if (data.sports.length) {
                await tx
                    .insert(branchSport)
                    .values(
                        data.sports.map(sportId => ({
                            branchId: id,
                            sportId,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))
                    )
            }

            // Update facilities (clear and recreate)
            await tx.delete(branchFacility).where(eq(branchFacility.branchId, id))
            if (data.facilities.length) {
                await tx
                    .insert(branchFacility)
                    .values(
                        data.facilities.map(facilityId => ({
                            branchId: id,
                            facilityId,
                            createdAt: sql`now()`,
                            updatedAt: sql`now()`,
                        }))
                    )
            }
        })

        revalidatePath('/on-boarding/location')
        return { success: true, error: null }
    } catch (error) {
        console.error('Error updating onboarding location:', error)
        return { error: 'Failed to update location' }
    }
    finally {
        revalidateTag(`locations-${academy?.id.toString()}`)
    }
}

interface OnboardingCoachData {
    name: string
    title: string
    bio: string
    gender: string
    dateOfBirth: Date
    privateSessionPercentage: string
    sports: number[]
    languages: number[]
    image?: string | null
}

export const createOnboardingCoach = async (data: OnboardingCoachData) => {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root' }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academy) return { error: 'Academy not found', field: 'root', data: null }

    try {
        return await db.transaction(async (tx) => {
            const [coach] = await tx
                .insert(coaches)
                .values({
                    name: data.name,
                    title: data.title,
                    bio: data.bio,
                    gender: data.gender,
                    dateOfBirth: formatDateForDB(data.dateOfBirth),
                    privateSessionPercentage: data.privateSessionPercentage + '%',
                    academicId: academy.id,
                    image: data.image ? 'images/' + data.image : null,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                })
                .returning({
                    id: coaches.id,
                })

            await Promise.all([
                // Add sports
                data.sports.length > 0 ?
                    tx.insert(coachSport)
                        .values(
                            data.sports.map(sportId => ({
                                coachId: coach.id,
                                sportId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                // Add languages
                data.languages.length > 0 ?
                    tx.insert(coachSpokenLanguage)
                        .values(
                            data.languages.map(languageId => ({
                                coachId: coach.id,
                                spokenLanguageId: languageId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve()
            ])

            await revalidateTag(`coaches-${academy?.id.toString()}`)

            return { data: coach, success: true, error: null }
        })
    } catch (error) {
        console.error('Error creating onboarding coach:', error)
        return { error: 'Failed to create coach', field: 'root' }
    }
    // finally {
    //     revalidateTag(`coaches-${academy?.id.toString()}`)
    // }
}

export const updateOnboardingCoach = async (id: number, data: OnboardingCoachData) => {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized', field: 'root', data: null }
    }

    const academy = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    console.log('image', data.image)

    try {
        await db.transaction(async (tx) => {
            await tx
                .update(coaches)
                .set({
                    name: data.name,
                    title: data.title,
                    bio: data.bio,
                    gender: data.gender,
                    dateOfBirth: formatDateForDB(data.dateOfBirth),
                    privateSessionPercentage: data.privateSessionPercentage + '%',
                    image: data.image ? data?.image?.includes('images/') ? data.image.startsWith('images/') ? data.image : 'images/' + data.image?.split('images/')[1] : 'images/' + data.image : null,
                    updatedAt: sql`now()`
                })
                .where(eq(coaches.id, id))

            // Clear and recreate relations
            await Promise.all([
                tx.delete(coachSport).where(eq(coachSport.coachId, id)),
                tx.delete(coachSpokenLanguage).where(eq(coachSpokenLanguage.coachId, id))
            ])

            await Promise.all([
                // Recreate sports
                data.sports.length > 0 ?
                    tx.insert(coachSport)
                        .values(
                            data.sports.map(sportId => ({
                                coachId: id,
                                sportId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve(),

                data.languages.length > 0 ?
                    tx.insert(coachSpokenLanguage)
                        .values(
                            data.languages.map(languageId => ({
                                coachId: id,
                                spokenLanguageId: languageId,
                                createdAt: sql`now()`,
                                updatedAt: sql`now()`,
                            }))
                        ) : Promise.resolve()
            ])
        })

        await revalidateTag(`coaches-${academy?.id.toString()}`)

        return { success: true, error: null, data: { id } }
    } catch (error) {
        console.error('Error updating onboarding coach:', error)
        return { error: 'Failed to update coach', field: 'root' }
    }
    // finally {
    //     revalidateTag(`coaches-${academy?.id.toString()}`)
    // }
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
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string
    id?: number
}

export async function createOnboardingProgram(data: {
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

export async function updateOnboardingProgram(id: number, data: {
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
            ])
        })

        revalidatePath('/academy/programs')
        return { success: true }

    } catch (error) {
        console.error('Error updating program:', error)
        return { error: 'Failed to update program' }
    }
}

export const academyOnBoarded = async () => {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    try {
        const academic = await db.query.academics.findFirst({
            where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
            columns: {
                id: true,
            }
        })

        await db.update(academics).set({
            onboarded: true
        }).where(eq(academics.id, academic?.id!))
    }
    catch (error) {
        console.error('Error updating program:', error)
        return { error: 'Failed to update program' }
    }
    revalidatePath('/on-boarding')
}