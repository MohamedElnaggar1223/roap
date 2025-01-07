'use server'
import { auth } from "@/auth"
import { db } from "@/db"
import { academicAthletic, blockPrograms, blocks, bookings, bookingSessions, branchTranslations, coaches, entryFeesHistory, packageDiscount, packages, profiles, programs, schedules, sports, sportTranslations, users } from "@/db/schema"
import { and, desc, eq, inArray, or, sql } from "drizzle-orm"
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
    TimeSlot
} from '../validations/bookings'
import { formatDateForDB } from "../utils"
import { getImageUrl } from "../supabase-images"
import { cookies } from "next/headers"
import { format } from "date-fns"

export async function deleteBookings(ids: number[]) {
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

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
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

    const session = await auth()

    if (!session?.user) {
        return { data: [] }
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
        return { data: [] }
    }

    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, academicId),
        columns: {
            id: true,
        }
    })

    if (!academic) return { data: [] }

    try {
        const athletes = await db
            .select({
                id: profiles.id,
                name: profiles.name,
                image: profiles.image,
                phoneNumber: users.phoneNumber,
                birthday: profiles.birthday,
                academicAthleticId: academicAthletic.id,
            })
            .from(academicAthletic)
            .leftJoin(users, eq(academicAthletic.userId, users.id))
            .leftJoin(profiles, eq(academicAthletic.profileId, profiles.id))
            .where(and(
                or(
                    sql`${users.phoneNumber} ILIKE ${`%${query}%`}`,
                    sql`${academicAthletic.firstGuardianPhone} ILIKE ${`%${query}%`}`
                ),
                eq(academicAthletic.academicId, academic.id)
            ))
            .limit(5)

        console.log(athletes)

        const finalAthletes = await Promise.all(athletes.map(async (athlete) => {
            const image = await getImageUrl(athlete.image)
            return { ...athlete, phoneNumber: athlete.phoneNumber || '', image }
        }))

        return { data: finalAthletes as SearchedAthlete[] }
    } catch (error) {
        console.error('Error searching athletes:', error)
        return {
            error: {
                message: 'Failed to search athletes'
            }
        }
    }
}

function determinePackageType(name: string) {
    if (name.startsWith('Assessment')) return 'assessment';
    if (name.startsWith('Monthly')) return 'monthly';
    if (name.startsWith('Term')) return 'term';
    return 'full_season';
}


export async function getProgramDetails(programId: number): Promise<ProgramDetailsResponse> {
    try {
        const program = await db.query.programs.findFirst({
            where: eq(programs.id, programId),
            with: {
                packages: {
                    with: {
                        schedules: true
                    }
                },
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
                    sessionDuration: pkg.sessionDuration,
                    months: pkg.months,
                    capacity: pkg.capacity,
                    flexible: pkg.flexible,
                    schedules: pkg.schedules.map(s => ({
                        id: s.id,
                        day: s.day,
                        from: s.from,
                        to: s.to,
                        capacity: s.capacity
                    })),
                    endDate: pkg.endDate,
                    startDate: pkg.startDate
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

type CreateBookingInput = {
    profileId: number;
    packageId: number;
    coachId?: number;
    date: string;
    time: string; // Format: "HH:mm HH:mm"
};

export async function calculateSessionsAndPrice(
    packageDetails: any,
    selectedDate: Date,
    schedules: any[],
    bookingTime: string
) {
    const packageName = packageDetails.name.toLowerCase();
    const isAssessment = packageName.startsWith('assessment');
    const isMonthly = packageName.startsWith('monthly');
    let schedulesToUse = schedules;

    // If package is flexible, parse the selected schedules from bookingTime
    if (packageDetails.flexible) {
        schedulesToUse = JSON.parse(bookingTime);
    }

    const sessions = [];
    let totalPrice = Number(packageDetails.price);
    let deductions = 0;

    if (isAssessment) {
        // Assessment logic remains the same
        const [startTime, endTime] = bookingTime.split(' ');
        sessions.push({
            date: selectedDate,
            from: startTime,
            to: endTime,
            status: 'pending'
        });
    } else if (isMonthly) {
        const selectedMonthYear = format(selectedDate, 'MMMM yyyy');
        if (!packageDetails.months?.includes(selectedMonthYear)) {
            throw new Error('Selected month is not available in this package');
        }

        // Generate sessions only for the selected month
        const monthStartDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEndDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        // Get all possible sessions for this month using only the selected schedules
        const allSessions = generateSessionsFromSchedules(
            schedulesToUse,
            monthStartDate,
            monthEndDate,
            packageDetails
        );

        // Calculate price per session for the month
        const pricePerSession = totalPrice / allSessions.length;

        // Find missed sessions
        const missedSessions = allSessions.filter(
            session => session.date < selectedDate
        );

        deductions = missedSessions.length * pricePerSession;
        sessions.push(...allSessions.filter(
            session => session.date >= selectedDate
        ));
    } else {
        // Term and Full Season logic
        const packageStartDate = new Date(packageDetails.startDate);
        const endDate = new Date(packageDetails.endDate);

        const allSessions = generateSessionsFromSchedules(
            schedulesToUse,
            packageStartDate,
            endDate,
            packageDetails
        );

        const pricePerSession = totalPrice / allSessions.length;
        const missedSessions = allSessions.filter(
            session => session.date < selectedDate
        );

        deductions = missedSessions.length * pricePerSession;
        sessions.push(...allSessions.filter(
            session => session.date >= selectedDate
        ));
    }

    return {
        sessions,
        totalPrice,
        deductions,
        finalPrice: totalPrice - deductions
    };
}

export const getSportIdFromName = async (sportName: string) => {
    const sport = await db
        .select({
            id: sports.id,
            name: sql<string>`t.name`,
        })
        .from(sports)
        .innerJoin(
            sql`(
                        SELECT ct.sport_id, ct.name, ct.locale
                        FROM ${sportTranslations} ct
                        WHERE ct.locale = 'en'
                        UNION
                        SELECT ct2.sport_id, ct2.name, ct2.locale
                        FROM ${sportTranslations} ct2
                        INNER JOIN (
                            SELECT sport_id, MIN(locale) as first_locale
                            FROM ${sportTranslations}
                            WHERE sport_id NOT IN (
                                SELECT sport_id 
                                FROM ${sportTranslations} 
                                WHERE locale = 'en'
                            )
                            GROUP BY sport_id
                        ) first_trans ON ct2.sport_id = first_trans.sport_id 
                        AND ct2.locale = first_trans.first_locale
                    ) t`,
            sql`t.sport_id = ${sports.id}`
        )
        .where(sql`LOWER(t.name) = ${sportName.toLowerCase()}`)
        .limit(1)

    return sport[0]?.id;
}

export async function checkAssessmentDeduction(
    profileId: number,
    sportId: number,
    programId: number,
    packageDetails: any,
    startDate: string
): Promise<{ shouldPay: boolean; amount: number, assessmentBookingId?: number }> {
    const program = await db.query.programs.findFirst({
        where: eq(programs.id, programId),
        with: {
            branch: true
        }
    });
    const assessmentBookings = await db.query.bookings.findMany({
        where: and(
            eq(bookings.profileId, profileId),
            eq(bookings.status, 'success'),
            sql`${bookings.id} NOT IN (
                SELECT assessment_deduction_id 
                FROM ${bookings} 
                WHERE assessment_deduction_id IS NOT NULL
            )`
        ),
        with: {
            package: {
                with: {
                    program: {
                        columns: {
                            assessmentDeductedFromProgram: true,
                            id: true
                        },
                        with: {
                            sport: true,
                            branch: true
                        }
                    }
                }
            }
        },
        orderBy: [desc(bookings.createdAt)] // Get most recent first
    });

    console.log("Eligible assessment bookings", assessmentBookings.map(booking => `Assessment Deducted: ${booking.package?.program?.assessmentDeductedFromProgram}\nBranch: ${booking.package?.program?.branch?.id}\nSport: ${booking.package?.program?.sport?.id}\nPackage: ${booking.package?.name}\nPrice: ${booking.price}`))
    console.log("Current sport ID", sportId)
    console.log("Current branch ID", program?.branch?.id)
    // Find the most recent eligible assessment
    const eligibleAssessment = assessmentBookings.find(booking =>
        booking.package?.program?.assessmentDeductedFromProgram &&
        booking.package.program.sport?.id === sportId &&
        booking.package.name.toLowerCase().startsWith('assessment') &&
        booking.package.program.branch?.id === program?.branch?.id
    );

    console.log("Eligible assessment", eligibleAssessment)
    console.log(packageDetails.entryFees - Number(eligibleAssessment?.price))

    if (eligibleAssessment) {
        return {
            shouldPay: true,
            amount: packageDetails.entryFees - Number(eligibleAssessment.price),
            assessmentBookingId: eligibleAssessment.id
        };
    }
    return {
        shouldPay: false,
        amount: 0
    };
}

export async function checkEntryFees(
    profileId: number,
    sportId: number,
    programId: number,
    packageDetails: any,
    startDate: string
): Promise<{ shouldPay: boolean; amount: number, assessmentBookingId?: number }> {
    const currentDate = new Date(startDate);
    const entryFeesStartDate = packageDetails.entryFeesStartDate ? new Date(packageDetails.entryFeesStartDate) : null;
    const entryFeesEndDate = packageDetails.entryFeesEndDate ? new Date(packageDetails.entryFeesEndDate) : null;

    // Get the current program's branch


    if (entryFeesStartDate && currentDate < entryFeesStartDate) {
        return { shouldPay: false, amount: 0 };
    }
    if (entryFeesEndDate && currentDate > entryFeesEndDate) {
        return { shouldPay: false, amount: 0 };
    }

    const existingFees = await db.query.entryFeesHistory.findFirst({
        where: and(
            eq(entryFeesHistory.profileId, profileId),
            eq(entryFeesHistory.sportId, sportId),
            eq(entryFeesHistory.programId, programId)
        )
    });

    if (existingFees) {
        return { shouldPay: false, amount: 0 };
    }

    const packageName = packageDetails.name.toLowerCase();
    const isMonthly = packageName.startsWith('monthly');

    if (isMonthly && packageDetails.entryFeesAppliedUntil) {
        const currentMonthYear = format(currentDate, 'MMMM yyyy');
        if (!packageDetails.entryFeesAppliedUntil.includes(currentMonthYear)) {
            return { shouldPay: false, amount: 0 };
        }
    }

    // Get ALL assessment bookings that are eligible


    return {
        shouldPay: true,
        amount: Number(packageDetails.entryFees || 0)
    };
}

export const getPriceAfterActiveDiscounts = async (validatedInput: CreateBookingInput, totalPrice: number, deductions: number) => {
    const activeDiscounts = await db.query.packageDiscount.findMany({
        where: eq(packageDiscount.packageId, validatedInput.packageId),
        with: {
            discount: true
        }
    });

    // Apply discounts
    let discountedPrice = totalPrice - deductions;
    for (const { discount } of activeDiscounts) {
        if (discount.type === 'percentage') {
            discountedPrice *= (1 - discount.value / 100);
        } else {
            discountedPrice -= discount.value;
        }
    }

    return discountedPrice;
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResponse> {
    try {
        // Validate input
        const validatedInput = createBookingSchema.parse(input);

        // Validate session
        const session = await auth();
        if (!session?.user) {
            return { error: { message: 'Unauthorized' } };
        }

        // Get package details with related data
        const packageDetails = await db.query.packages.findFirst({
            where: eq(packages.id, validatedInput.packageId),
            with: {
                program: {
                    with: {
                        sport: true,
                        branch: true
                    }
                },
                schedules: true
            }
        });

        if (!packageDetails) {
            return { error: { message: 'Package not found', field: 'packageId' } };
        }

        if (!packageDetails.program?.sport) {
            return { error: { message: 'Invalid package configuration', field: 'packageId' } };
        }

        // Calculate sessions and initial price
        if (packageDetails.flexible) {
            const selectedSchedules = JSON.parse(validatedInput.time);

            // Verify selected schedules match sessionPerWeek
            if (selectedSchedules.length !== packageDetails.sessionPerWeek) {
                return { error: { message: 'Invalid number of sessions selected', field: 'time' } };
            }

            // Check capacity for each selected schedule
            for (const schedule of selectedSchedules) {
                const matchingSchedule = packageDetails.schedules.find(
                    s => s.day === schedule.day && s.from === schedule.from
                );
                if (!matchingSchedule || matchingSchedule.capacity <= 0) {
                    return { error: { message: 'One or more selected sessions are full', field: 'time' } };
                }
            }
        }

        // Calculate sessions and prices
        const selectedDate = new Date(validatedInput.date);
        const { sessions, totalPrice, deductions } = await calculateSessionsAndPrice(
            packageDetails,
            selectedDate,
            packageDetails.schedules,
            validatedInput.time
        );

        // Check entry fees
        const { shouldPay: shouldPayEntryFees, amount: entryFeesAmount } =
            await checkEntryFees(
                validatedInput.profileId,
                packageDetails.program.sport.id,
                packageDetails.program.id,
                packageDetails,
                validatedInput.date
            );

        const { shouldPay: shouldPayAssessmentDeduction, amount: assessmentDeductionAmount, assessmentBookingId } =
            await checkAssessmentDeduction(
                validatedInput.profileId,
                packageDetails.program.sport.id,
                packageDetails.program.id,
                packageDetails,
                validatedInput.date
            );

        // Get active discounts
        const discountedPrice = await getPriceAfterActiveDiscounts(validatedInput, totalPrice, deductions);

        // Create booking in a transaction
        const [newBooking] = await db.transaction(async (tx) => {
            // Create booking
            const [booking] = await tx.insert(bookings).values({
                profileId: validatedInput.profileId,
                packageId: validatedInput.packageId,
                coachId: validatedInput.coachId || null,
                price: discountedPrice + (shouldPayEntryFees ? entryFeesAmount : 0) + (shouldPayAssessmentDeduction ? assessmentDeductionAmount : 0),
                packagePrice: packageDetails.price,
                status: 'success',
                academyPolicy: false,
                roapPolicy: false,
                entryFeesPaid: shouldPayEntryFees,
                assessmentDeductionId: assessmentBookingId || null,
                createdAt: sql`now()`,
                updatedAt: sql`now()`
            }).returning();

            console.log("sessions", sessions)

            // Create booking sessions
            await tx.insert(bookingSessions).values(
                sessions.map(session => ({
                    bookingId: booking.id,
                    date: formatDateForDB(session.date),
                    from: session.from,
                    to: session.to,
                    status: 'pending',
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                }))
            );

            // Record entry fees payment if needed
            if (shouldPayEntryFees && packageDetails.program?.sport) {
                await tx.insert(entryFeesHistory).values({
                    profileId: validatedInput.profileId,
                    sportId: packageDetails.program.sport.id,
                    programId: packageDetails.program.id,
                    paidAt: sql`now()`,
                    createdAt: sql`now()`,
                    updatedAt: sql`now()`
                });
            }

            if (packageDetails.flexible) {
                const selectedSchedules = JSON.parse(validatedInput.time);
                // Update capacity for each selected schedule
                for (const schedule of selectedSchedules) {
                    await tx.update(schedules)
                        .set({
                            capacity: sql`${schedules.capacity} - 1`
                        })
                        .where(and(
                            eq(schedules.packageId, packageDetails.id),
                            eq(schedules.day, schedule.day),
                            eq(schedules.from, schedule.from)
                        ));
                }
            }

            return [booking];
        });

        revalidatePath('/calendar');
        return { data: newBooking };

    } catch (error) {
        console.error('Error creating booking:', error);
        return {
            error: {
                message: error instanceof Error ? error.message : 'Failed to create booking'
            }
        };
    }
}

const days = {
    'sun': 'Sunday',
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday'
}

function generateSessionsFromSchedules(
    schedules: any[],
    startDate: Date,
    endDate: Date,
    packageDetails: any
): Array<{ date: Date; from: string; to: string }> {
    const sessions = [];
    const currentDate = new Date(startDate);

    // For flexible packages, schedules will be the JSON parsed selected schedules
    const schedulesToUse = packageDetails.flexible ?
        schedules : // These are the selected schedules
        packageDetails.schedules; // All package schedules

    while (currentDate <= endDate) {
        const daySchedule = schedulesToUse.find(
            (s: any) => days[s.day.toLowerCase() as keyof typeof days].toLowerCase() ===
                currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        );

        if (daySchedule) {
            sessions.push({
                date: new Date(currentDate),
                from: daySchedule.from,
                to: daySchedule.to
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return sessions;
}

// export async function getAvailableTimeSlots(
//     date: string,
//     coachId: number | null
// ): Promise<TimeSlotResponse> {
//     try {
//         const parsedDate = formatDateForDB(new Date(date))

//         if (!coachId) {
//             const allTimeSlots = generateTimeSlots().map(time => ({
//                 time,
//                 isAvailable: true
//             }))
//             return { data: allTimeSlots }
//         }

//         const bookedSlotsData = await db.query.bookingSessions.findMany({
//             where: and(
//                 eq(bookingSessions.date, parsedDate)
//                 // eq(bookings.coachId, coachId)
//             ),
//             with: {
//                 booking: true
//             }
//         })

//         const bookedSlots = bookedSlotsData.filter(slot => slot.booking.coachId === coachId)

//         const blockedSlotsData = await db.query.blockCoaches.findMany({
//             where: and(
//                 // eq(blocks.date, parsedDate),
//                 eq(blockCoaches.coachId, coachId)
//             ),
//             with: {
//                 block: true
//             }
//         })

//         const blockedSlots = blockedSlotsData.filter(slot => slot.block.date === parsedDate)

//         const allTimeSlots = generateTimeSlots().map(time => ({
//             time,
//             isAvailable: true
//         }))

//         console.log("All time slots", allTimeSlots)
//         console.log("Booked slots", bookedSlots)
//         console.log("Blocked slots", blockedSlots)

//         const availableSlots = allTimeSlots.map(slot => {
//             const isBooked = bookedSlots.some(booking => booking.from === slot.time)
//             const isBlocked = blockedSlots.some(block =>
//                 block.block.startTime <= slot.time &&
//                 block.block.endTime > slot.time
//             )

//             return {
//                 ...slot,
//                 isAvailable: !isBooked && !isBlocked,
//                 reason: isBooked ? 'booked' as const :
//                     isBlocked ? 'blocked' as const :
//                         undefined
//             }
//         })

//         return { data: availableSlots }

//     } catch (error) {
//         console.error('Error getting available time slots:', error)
//         return {
//             error: {
//                 message: 'Failed to fetch available time slots'
//             }
//         }
//     }
// }

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