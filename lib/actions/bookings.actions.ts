'use server'
import { auth } from "@/auth"
import { db } from "@/db"
import { blockCoaches, blocks, bookings, bookingSessions, branchTranslations, coaches, packages, profiles, programs, sportTranslations, users } from "@/db/schema"
import { and, eq, inArray, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { revalidatePath } from 'next/cache'
import { createBookingSchema } from '../validations/bookings'
import type {
    SearchAthletesResponse,
    ProgramDetailsResponse,
    CreateBookingResponse,
    TimeSlotResponse,
    ValidationResult,
    SearchedAthlete,
    CreateBookingInput,
    TimeSlot
} from '../validations/bookings'
import { formatDateForDB } from "../utils"
import { getImageUrl } from "../supabase-images"

export async function deleteBookings(ids: number[]) {
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
        await db.delete(bookings)
            .where(inArray(bookings.id, ids))

        return { error: null }
    } catch (error) {
        console.error('Error deleting bookings:', error)
        return { error: 'Failed to delete bookings' }
    }
    finally {
        revalidateTag(`athletes-${academic?.id}`)
    }
}

export async function searchAthletes(query: string): Promise<SearchAthletesResponse> {
    if (!query || query.length < 3) return { data: [] }

    try {
        const athletes = await db
            .select({
                id: profiles.id,
                name: profiles.name,
                image: profiles.image,
                phoneNumber: users.phoneNumber
            })
            .from(profiles)
            .innerJoin(
                users,
                eq(profiles.userId, users.id)
            )
            .where(sql`${users.phoneNumber} ILIKE ${`%${query}%`}`)
            .limit(5)

        const finalAthletes = await Promise.all(athletes.map(async (athlete) => {
            const image = await getImageUrl(athlete.image)
            return { ...athlete, phoneNumber: athlete.phoneNumber || '', image }
        }))

        return { data: finalAthletes }
    } catch (error) {
        console.error('Error searching athletes:', error)
        return {
            error: {
                message: 'Failed to search athletes'
            }
        }
    }
}


export async function getProgramDetails(programId: number): Promise<ProgramDetailsResponse> {
    try {
        const program = await db.query.programs.findFirst({
            where: eq(programs.id, programId),
            with: {
                packages: true,
                coachPrograms: {
                    with: {
                        coach: true
                    }
                },
                branch: {
                    with: {
                        branchTranslations: {
                            where: eq(branchTranslations.locale, 'en')
                        }
                    }
                },
                sport: {
                    with: {
                        sportTranslations: {
                            where: eq(sportTranslations.locale, 'en')
                        }
                    }
                }
            }
        })

        if (!program) {
            return {
                error: {
                    message: 'Program not found',
                    field: 'programId'
                }
            }
        }

        return {
            data: {
                id: program.id,
                name: program.name || '',
                branch: program.branch?.branchTranslations[0]?.name || '',
                sport: program.sport?.sportTranslations[0]?.name || '',
                packages: program.packages.map(pkg => ({
                    id: pkg.id,
                    name: pkg.name,
                    price: Number(pkg.price),
                    entryFees: pkg.entryFees ? Number(pkg.entryFees) : null,
                    sessionPerWeek: pkg.sessionPerWeek,
                    sessionDuration: pkg.sessionDuration
                })),
                coaches: program.coachPrograms.map(cp => ({
                    id: cp.coach.id,
                    name: cp.coach.name,
                    image: cp.coach.image
                }))
            }
        }
    } catch (error) {
        console.error('Error fetching program details:', error)
        return {
            error: {
                message: 'Failed to fetch program details'
            }
        }
    }
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResponse> {
    try {
        // Validate input
        const validatedInput = createBookingSchema.parse(input)

        // Validate session
        const session = await auth()
        if (!session?.user) {
            return {
                error: {
                    message: 'Unauthorized'
                }
            }
        }

        // Validate booking data
        const validation = await validateBooking(validatedInput)
        if (!validation.isValid) {
            return {
                error: {
                    message: 'Invalid booking data',
                    field: Object.keys(validation.errors)[0]
                }
            }
        }

        // Get package details
        const packageDetails = await db.query.packages.findFirst({
            where: eq(packages.id, validatedInput.packageId),
            with: {
                program: true
            }
        })

        if (!packageDetails) {
            return {
                error: {
                    message: 'Package not found',
                    field: 'packageId'
                }
            }
        }

        // Calculate total price
        const totalPrice = Number(packageDetails.price) + (packageDetails.entryFees ? Number(packageDetails.entryFees) : 0)

        // Create booking in a transaction
        const [newBooking] = await db.transaction(async (tx) => {
            const [booking] = await tx.insert(bookings).values({
                profileId: validatedInput.profileId,
                packageId: validatedInput.packageId,
                coachId: validatedInput.coachId || null,
                price: totalPrice,
                packagePrice: packageDetails.price,
                status: 'success',
                academyPolicy: false,
                roapPolicy: false,
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            }).returning()

            await tx.insert(bookingSessions).values({
                bookingId: booking.id,
                date: formatDateForDB(new Date(validatedInput.date)),
                from: validatedInput.time,
                to: calculateEndTime(validatedInput.time, packageDetails.sessionDuration || 60),
                status: 'pending',
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            })

            return [booking]
        })

        revalidatePath('/calendar')
        return { data: newBooking }

    } catch (error) {
        console.error('Error creating booking:', error)
        return {
            error: {
                message: error instanceof Error ? error.message : 'Failed to create booking'
            }
        }
    }
}

export async function getAvailableTimeSlots(
    date: string,
    coachId: number | null
): Promise<TimeSlotResponse> {
    try {
        const parsedDate = formatDateForDB(new Date(date))

        if (!coachId) {
            const allTimeSlots = generateTimeSlots().map(time => ({
                time,
                isAvailable: true
            }))
            return { data: allTimeSlots }
        }

        const bookedSlotsData = await db.query.bookingSessions.findMany({
            where: and(
                eq(bookingSessions.date, parsedDate)
                // eq(bookings.coachId, coachId)
            ),
            with: {
                booking: true
            }
        })

        const bookedSlots = bookedSlotsData.filter(slot => slot.booking.coachId === coachId)

        const blockedSlotsData = await db.query.blockCoaches.findMany({
            where: and(
                // eq(blocks.date, parsedDate),
                eq(blockCoaches.coachId, coachId)
            ),
            with: {
                block: true
            }
        })

        const blockedSlots = blockedSlotsData.filter(slot => slot.block.date === parsedDate)

        const allTimeSlots = generateTimeSlots().map(time => ({
            time,
            isAvailable: true
        }))

        console.log("All time slots", allTimeSlots)
        console.log("Booked slots", bookedSlots)
        console.log("Blocked slots", blockedSlots)

        const availableSlots = allTimeSlots.map(slot => {
            const isBooked = bookedSlots.some(booking => booking.from === slot.time)
            const isBlocked = blockedSlots.some(block =>
                block.block.startTime <= slot.time &&
                block.block.endTime > slot.time
            )

            return {
                ...slot,
                isAvailable: !isBooked && !isBlocked,
                reason: isBooked ? 'booked' as const :
                    isBlocked ? 'blocked' as const :
                        undefined
            }
        })

        return { data: availableSlots }

    } catch (error) {
        console.error('Error getting available time slots:', error)
        return {
            error: {
                message: 'Failed to fetch available time slots'
            }
        }
    }
}

async function validateBooking(input: CreateBookingInput): Promise<ValidationResult> {
    const errors: Record<string, string> = {}

    // Validate profile
    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, input.profileId)
    })

    console.log("Profile", profile)

    if (!profile) {
        errors.profile = 'Athlete not found'
    }

    // Validate package
    const packageDetails = await db.query.packages.findFirst({
        where: eq(packages.id, input.packageId)
    })

    console.log("Package", packageDetails)

    if (!packageDetails) {
        errors.package = 'Package not found'
    } else {
        const currentDate = new Date()
        const startDate = new Date(packageDetails.startDate)
        const endDate = new Date(packageDetails.endDate)

        if (currentDate < startDate || currentDate > endDate) {
            console.log("Package is not active")
            // errors.package = 'Package is not active'
        }
    }

    if (input.coachId) {
        // Validate coach
        const coach = await db.query.coaches.findFirst({
            where: eq(coaches.id, input.coachId)
        })

        if (!coach) {
            errors.coach = 'Coach not found'
        }
    }


    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

function generateTimeSlots(): string[] {
    const slots = []
    for (let hour = 8; hour < 20; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00:00`)
    }
    return slots
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0)

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`
}