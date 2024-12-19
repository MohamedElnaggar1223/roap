'use server'
import { z } from 'zod'
import { db } from '@/db'
import { blocks, blockBranches, blockSports, blockPackages, blockCoaches, sportTranslations, sports, coaches, branches, branchTranslations, branchSport, academicSport, packages, programs } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { createBlockSchema } from '../validations/blocks'

export async function createBlock(input: z.infer<typeof createBlockSchema>) {
    try {
        // Validate session and permissions
        const session = await auth()
        if (!session?.user || session.user.role !== 'academic') {
            return { error: 'You are not authorized to perform this action', field: null, data: [] }
        }

        // Get the academic ID for the current user
        const academic = await db.query.academics.findFirst({
            where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
            columns: { id: true }
        })

        if (!academic) {
            return { error: 'Academic not found' }
        }

        // Validate input
        const validatedData = createBlockSchema.parse(input)

        // Validate time format and range
        const startTime = new Date(`1970-01-01T${validatedData.startTime}`)
        const endTime = new Date(`1970-01-01T${validatedData.endTime}`)

        if (startTime >= endTime) {
            return { error: 'End time must be after start time' }
        }

        // Check for existing blocks in the same time period
        const existingBlock = await db.query.blocks.findFirst({
            where: (blocks, { and, eq }) => and(
                eq(blocks.academicId, academic.id),
                eq(blocks.date, validatedData.date),
                sql`(
                    (${blocks.startTime} < ${validatedData.endTime}::time AND 
                     ${blocks.endTime} > ${validatedData.startTime}::time)
                )`
            )
        })

        if (existingBlock) {
            return { error: 'There is already a block during this time period' }
        }

        // Start a transaction to ensure all operations succeed or fail together
        return await db.transaction(async (tx) => {
            // Create the main block
            const [newBlock] = await tx.insert(blocks).values({
                academicId: academic.id,
                date: validatedData.date,
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
                branchScope: validatedData.branches === 'all' ? 'all' : 'specific',
                sportScope: validatedData.sports === 'all' ? 'all' : 'specific',
                packageScope: validatedData.packages === 'all' ? 'all' : 'specific',
                coachScope: validatedData.coaches === 'all' ? 'all' : 'specific',
                note: validatedData.note,
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            }).returning()

            // Insert branch relations if specific branches are selected
            if (validatedData.branches !== 'all') {
                await tx.insert(blockBranches).values(
                    validatedData.branches.map(branchId => ({
                        blockId: newBlock.id,
                        branchId: branchId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`
                    }))
                )
            }

            // Insert sport relations if specific sports are selected
            if (validatedData.sports !== 'all') {
                await tx.insert(blockSports).values(
                    validatedData.sports.map(sportId => ({
                        blockId: newBlock.id,
                        sportId: sportId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`
                    }))
                )
            }

            // Insert package relations if specific packages are selected
            if (validatedData.packages !== 'all') {
                await tx.insert(blockPackages).values(
                    validatedData.packages.map(packageId => ({
                        blockId: newBlock.id,
                        packageId: packageId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`
                    }))
                )
            }

            // Insert coach relations if specific coaches are selected
            if (validatedData.coaches !== 'all') {
                await tx.insert(blockCoaches).values(
                    validatedData.coaches.map(coachId => ({
                        blockId: newBlock.id,
                        coachId: coachId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`
                    }))
                )
            }

            revalidatePath('/calendar') // Adjust the path as needed

            return {
                success: true,
                data: newBlock,
                error: null
            }
        })

    } catch (error) {
        console.error('Error creating block:', error)
        if (error instanceof z.ZodError) {
            return {
                error: 'Invalid input data',
                validationErrors: error.errors
            }
        }
        return { error: 'Failed to create block' }
    }
}

type BlockData = {
    branches: {
        id: number
        name: string
        sports: number[]
        coaches: number[]
    }[]
    sports: {
        id: number
        name: string
        coaches: number[]
    }[]
    packages: {
        id: number
        name: string
        sportId: number
        coaches: number[]
    }[]
    coaches: {
        id: number
        name: string
        branchIds: number[]
        sportIds: number[]
    }[]
}

export async function getBlockData(): Promise<{ data: BlockData | null; error: string | null }> {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'academic') {
            return { data: null, error: 'Unauthorized' }
        }

        const academic = await db.query.academics.findFirst({
            where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
            columns: { id: true }
        })

        if (!academic) {
            return { data: null, error: 'Academic not found' }
        }

        // Fetch all related data in parallel with proper type casting
        const [branchesData, sportsData, packagesData, coachesData] = await Promise.all([
            // Get branches with their sports
            db.select({
                id: branches.id,
                name: branchTranslations.name,
                sports: sql<number[]>`array_agg(DISTINCT cast(${branchSport.sportId} as integer))`,
                coaches: sql<number[]>`array_agg(DISTINCT cast(${coaches.id} as integer))`
            })
                .from(branches)
                .innerJoin(branchTranslations, and(
                    eq(branches.id, branchTranslations.branchId),
                    eq(branchTranslations.locale, 'en')
                ))
                .leftJoin(branchSport, eq(branches.id, branchSport.branchId))
                .leftJoin(coaches, eq(branches.academicId, coaches.academicId))
                .where(eq(branches.academicId, academic.id))
                .groupBy(branches.id, branchTranslations.name),

            // Get sports with their coaches
            db.select({
                id: sports.id,
                name: sportTranslations.name,
                coaches: sql<number[]>`array_agg(DISTINCT cast(${coaches.id} as integer))`
            })
                .from(sports)
                .innerJoin(sportTranslations, and(
                    eq(sports.id, sportTranslations.sportId),
                    eq(sportTranslations.locale, 'en')
                ))
                .innerJoin(branchSport, eq(sports.id, branchSport.sportId))
                .innerJoin(branches, and(
                    eq(branchSport.branchId, branches.id),
                    eq(branches.academicId, academic.id)
                ))
                .leftJoin(coaches, eq(branches.academicId, coaches.academicId))
                .groupBy(sports.id, sportTranslations.name),

            // Get packages with their sport and coaches
            db.select({
                id: packages.id,
                name: packages.name,
                sportId: programs.sportId,
                coaches: sql<number[]>`array_agg(DISTINCT cast(${coaches.id} as integer))`
            })
                .from(packages)
                .innerJoin(programs, and(
                    eq(packages.programId, programs.id),
                    eq(programs.academicId, academic.id)
                ))
                .leftJoin(coaches, eq(programs.academicId, coaches.academicId))
                .groupBy(packages.id, packages.name, programs.sportId),

            // Get coaches with their branches and sports
            db.select({
                id: coaches.id,
                name: coaches.name,
                branchIds: sql<number[]>`array_agg(DISTINCT cast(${branches.id} as integer))`,
                sportIds: sql<number[]>`array_agg(DISTINCT cast(${programs.sportId} as integer))`
            })
                .from(coaches)
                .where(eq(coaches.academicId, academic.id))
                .leftJoin(branches, eq(coaches.academicId, branches.academicId))
                .leftJoin(programs, eq(coaches.academicId, programs.academicId))
                .groupBy(coaches.id, coaches.name)
        ])

        return {
            data: {
                branches: branchesData.map(b => ({
                    ...b,
                    sports: b.sports.filter(Boolean).map(Number),
                    coaches: b.coaches.filter(Boolean).map(Number)
                })),
                sports: sportsData.map(s => ({
                    ...s,
                    coaches: s.coaches.filter(Boolean).map(Number)
                })),
                packages: packagesData.map(p => ({
                    ...p,
                    sportId: Number(p.sportId) || 0,
                    coaches: p.coaches.filter(Boolean).map(Number)
                })),
                coaches: coachesData.map(c => ({
                    ...c,
                    branchIds: c.branchIds.filter(Boolean).map(Number),
                    sportIds: c.sportIds.filter(Boolean).map(Number)
                }))
            },
            error: null
        }
    } catch (error) {
        console.error('Error fetching block data:', error)
        return { data: null, error: 'Failed to fetch block data' }
    }
}