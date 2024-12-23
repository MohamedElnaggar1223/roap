'use server'
import { z } from 'zod'
import { db } from '@/db'
import { blocks, blockBranches, blockSports, blockPackages, blockPrograms, sportTranslations, sports, programs, branches, branchTranslations, branchSport, academicSport, packages } from '@/db/schema'
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
                programScope: validatedData.programs === 'all' ? 'all' : 'specific', // Changed from coachScope
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

            // Insert program relations if specific programs are selected
            if (validatedData.programs !== 'all') {
                await tx.insert(blockPrograms).values(
                    validatedData.programs.map(programId => ({
                        blockId: newBlock.id,
                        programId: programId,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`
                    }))
                )
            }

            revalidatePath('/calendar')

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
        programs: number[] // Changed from coaches
    }[]
    sports: {
        id: number
        name: string
        programs: number[] // Changed from coaches
    }[]
    packages: {
        id: number
        name: string
        sportId: number
        programs: number[] // Changed from coaches
    }[]
    programs: { // Changed from coaches
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

        console.log(academic.id)

        // Fetch all related data in parallel with proper type casting
        const [branchesData, sportsData, packagesData, programsData] = await Promise.all([
            // Get branches with their sports and programs
            db.select({
                id: branches.id,
                name: branchTranslations.name,
                sports: sql<number[]>`array_agg(DISTINCT cast(${branchSport.sportId} as integer))`,
                programs: sql<number[]>`array_agg(DISTINCT cast(${programs.id} as integer))`
            })
                .from(branches)
                .innerJoin(branchTranslations, and(
                    eq(branches.id, branchTranslations.branchId),
                    eq(branchTranslations.locale, 'en')
                ))
                .leftJoin(branchSport, eq(branches.id, branchSport.branchId))
                .leftJoin(programs, and(
                    eq(branches.id, programs.branchId),
                    eq(branches.academicId, programs.academicId)
                ))
                .where(eq(branches.academicId, academic.id))
                .groupBy(branches.id, branchTranslations.name),

            // Get sports with their programs
            db.select({
                id: sports.id,
                name: sportTranslations.name,
                programs: sql<number[]>`array_agg(DISTINCT cast(${programs.id} as integer))`
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
                .leftJoin(programs, and(
                    eq(sports.id, programs.sportId),
                    eq(branches.academicId, programs.academicId)
                ))
                .groupBy(sports.id, sportTranslations.name),

            // Get packages with their sport and programs
            db.select({
                id: packages.id,
                name: packages.name,
                sportId: programs.sportId,
                programs: sql<number[]>`array_agg(DISTINCT cast(${programs.id} as integer))`
            })
                .from(packages)
                .innerJoin(programs, and(
                    eq(packages.programId, programs.id),
                    eq(programs.academicId, academic.id)
                ))
                .groupBy(packages.id, packages.name, programs.sportId),

            // Get programs with their branches and sports
            db.select({
                id: programs.id,
                name: programs.name,
                branchIds: sql<number[]>`array_agg(DISTINCT cast(${branches.id} as integer))`,
                sportIds: sql<number[]>`array_agg(DISTINCT cast(${programs.sportId} as integer))`
            })
                .from(programs)
                .where(eq(programs.academicId, academic.id))
                .leftJoin(branches, eq(programs.branchId, branches.id))
                .groupBy(programs.id, programs.name, programs.sportId)
        ])

        return {
            data: {
                branches: branchesData.map(b => ({
                    ...b,
                    sports: b.sports.filter(Boolean).map(Number),
                    programs: b.programs.filter(Boolean).map(Number)
                })),
                sports: sportsData.map(s => ({
                    ...s,
                    programs: s.programs.filter(Boolean).map(Number)
                })),
                packages: packagesData.map(p => ({
                    ...p,
                    sportId: Number(p.sportId) || 0,
                    programs: p.programs.filter(Boolean).map(Number)
                })),
                programs: programsData.map(p => ({
                    ...p,
                    branchIds: p.branchIds.filter(Boolean).map(Number),
                    sportIds: p.sportIds.filter(Boolean).map(Number),
                    name: p.name ?? ''
                }))
            },
            error: null
        }
    } catch (error) {
        console.error('Error fetching block data:', error)
        return { data: null, error: 'Failed to fetch block data' }
    }
}