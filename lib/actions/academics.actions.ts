'use server'

import { SQL, and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { entryFeesHistory, academics, academicSport, academicTranslations, blockBranches, blockPrograms, blockPackages, blocks, blockSports, bookings, bookingSessions, branches, branchTranslations, coaches, media, packages, profiles, programs, sports, sportTranslations, users, coachSpokenLanguage, academicAthletic, branchFacility, branchSport, coachPackage, coachProgram, coachSport, promoCodes, schedules, wishlist } from '@/db/schema'
// import { auth } from '../auth'
import bcrypt from "bcryptjs";
import { isAdmin } from '../admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import { academySignUpSchema } from '../validations/auth';
import { auth } from '@/auth';
import { academyDetailsSchema } from '../validations/academies';
import { getImageUrl } from '../supabase-images';
import { getCoaches } from './coaches.actions';
import { getLocations } from './locations.actions';
import { getPrograms } from './programs.actions';
import { getAssessments } from './assessments.actions';
import { getAllSpokenLanguages } from './spoken-languages.actions';
import { cookies } from 'next/headers';

export const getAcademyDetails = async () => {
	const session = await auth()

	if (!session?.user) {
		return {
			error: 'You are not authorized to perform this action', field: null, data: {
				sports: [],
				gallery: [],
				id: 0,
				slug: '',
				policy: '',
				entryFees: 0,
				extra: '',
				logo: '',
				name: '',
				description: '',
				locale: '',
				s: undefined
			}
		}
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
		return {
			error: 'You are not authorized to perform this action', field: null, data: {
				sports: [],
				gallery: [],
				id: 0,
				slug: '',
				policy: '',
				entryFees: 0,
				extra: '',
				logo: '',
				name: '',
				description: '',
				locale: '',
				s: undefined
			}
		}
	}

	try {
		const data = await db
			.select({
				id: academics.id,
				slug: academics.slug,
				policy: academics.policy,
				entryFees: academics.entryFees,
				extra: academics.extra,
				logo: academics.image,
				name: sql<string>`t.name`,
				description: sql<string>`t.description`,
				locale: sql<string>`t.locale`,
				sports: sql<number[]>`array_agg(DISTINCT ${academicSport.sportId})::bigint[]`,
				gallery: sql<string[]>`array_remove(array_agg(DISTINCT CASE 
                    WHEN ${media.url} IS NOT NULL 
                    THEN ${media.url} 
                    END), NULL)`
			})
			.from(academics)
			.innerJoin(
				sql`(
                    SELECT at.academic_id, at.name, at.description, at.locale
                    FROM ${academicTranslations} at
                    WHERE at.locale = 'en'
                    UNION ALL
                    SELECT at.academic_id, at.name, at.description, at.locale
                    FROM ${academicTranslations} at
                    WHERE at.academic_id NOT IN (
                        SELECT academic_id 
                        FROM ${academicTranslations} 
                        WHERE locale = 'en'
                    )
                ) t`,
				sql`t.academic_id = ${academics.id}`
			)
			.leftJoin(
				academicSport,
				eq(academicSport.academicId, academics.id)
			)
			.leftJoin(
				media,
				and(
					eq(media.referableId, academics.id),
					// eq(media.referableType, 'App\\Models\\Academic')
				)
			)
			.where(eq(academics.userId, academicId))
			.groupBy(
				academics.id,
				academics.slug,
				academics.policy,
				academics.entryFees,
				academics.extra,
				academics.image,
				sql`t.name`,
				sql`t.description`,
				sql`t.locale`
			)

		console.log(academicId)
		console.log(data)

		if (!data || data.length === 0) {
			return {
				error: 'Academy not found', field: null, data: {
					sports: [],
					gallery: [],
					id: 0,
					slug: '',
					policy: '',
					entryFees: 0,
					extra: '',
					logo: '',
					name: '',
					description: '',
					locale: '',
					s: undefined
				}
			}
		}

		return {
			data: {
				...data[0],
				sports: data[0].sports.filter(Boolean).map(Number),
				gallery: data[0].gallery || []
			},
			error: null,
			field: null
		}

	} catch (error) {
		console.error('Error fetching academy details:', error)
		return {
			error: `Failed to fetch academy details: ${error}`, field: null, data: {
				sports: [],
				gallery: [],
				id: 0,
				slug: '',
				policy: '',
				entryFees: 0,
				extra: '',
				logo: '',
				name: '',
				description: '',
				locale: '',
				s: undefined
			}
		}
	}
}

export const getAcademyDetailsClient = async (url: string | null) => {
	if (!url) return

	const [
		{ data: academyDetails, error: academyDetailsError },
		{ data: coaches, error: coachesError },
		{ data: locations, error: locationsError },
		{ data: assessments, error: assessmentsError },
		{ data: programs, error: programsError },
		sports,
		languages
	] = await Promise.all([
		getAcademyDetails(),
		getCoaches(),
		getLocations(),
		getAssessments(),
		getPrograms(),
		getAllSports('sports'),
		getAllSpokenLanguages()
	])

	const [logo, gallery] = await Promise.all([
		getImageUrl(academyDetails?.logo!),
		Promise.all(academyDetails?.gallery?.map(async (image) => {
			const imageUrl = await getImageUrl(image)
			return imageUrl
		})!)
	])

	const finalAcademyDetails = {
		...academyDetails,
		locations,
		assessments,
		programs,
		coaches,
		sports: academyDetails?.sports.filter(s => !isNaN(s)) ?? [],
		logo,
		gallery: gallery as unknown as string[]
	}

	return finalAcademyDetails
}

export async function getPaginatedAcademics(
	page: number = 1,
	pageSize: number = 10,
	orderBy: SQL = desc(academics.createdAt)
) {
	const isAdminRes = await isAdmin()
	if (!isAdminRes) return {
		data: [],
		meta: {
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		},
	}

	const offset = (page - 1) * pageSize

	const data = await db
		.select({
			id: academics.id,
			slug: academics.slug,
			policy: academics.policy,
			entryFees: academics.entryFees,
			status: academics.status,
			userId: academics.userId,
			userName: users.name,
			name: sql<string>`t.name`,
			description: sql<string>`t.description`,
			locale: sql<string>`t.locale`,
			createdAt: academics.createdAt,
			onboarded: academics.onboarded,
		})
		.from(academics)
		.leftJoin(users, eq(academics.userId, users.id))
		.innerJoin(
			sql`(
        SELECT at.academic_id, at.name, at.description, at.locale
        FROM ${academicTranslations} at
        WHERE at.locale = 'en'
        UNION
        SELECT at.academic_id, at.name, at.description, at.locale
        FROM ${academicTranslations} at
        WHERE at.academic_id NOT IN (
          SELECT academic_id 
          FROM ${academicTranslations} 
          WHERE locale = 'en'
        )
      ) t`,
			sql`t.academic_id = ${academics.id}`
		)
		.orderBy(orderBy)
		.limit(pageSize)
		.offset(offset)

	console.log("Data", data)

	const orderedData = [...data.filter(a => a.createdAt !== null).sort((a, b) => new Date(a?.createdAt!) > new Date(b?.createdAt!) ? -1 : 1), ...data.filter(a => a.createdAt === null)]

	const [{ count }] = await db
		.select({ count: sql`count(*)`.mapWith(Number) })
		.from(academics)

	return {
		data: orderedData,
		meta: {
			page,
			pageSize,
			totalItems: count,
			totalPages: Math.ceil(count / pageSize),
		},
	}
}

export const deleteAcademics = async (ids: number[]) => {
	const isAdminRes = await isAdmin()

	if (!isAdminRes) return {
		data: null,
		error: 'You are not authorized to perform this action',
	}

	try {
		// Start a transaction to ensure all related deletions succeed or none do
		await db.transaction(async (tx) => {
			// Delete all related records in the correct order to maintain referential integrity

			// 1. Handle booking related tables
			await tx.delete(bookingSessions)
				.where(inArray(bookingSessions.bookingId,
					db.select({ id: bookings.id })
						.from(bookings)
						.innerJoin(packages, eq(bookings.packageId, packages.id))
						.innerJoin(programs, eq(packages.programId, programs.id))
						.where(inArray(programs.academicId, ids))
				))

			await tx.delete(bookings)
				.where(inArray(bookings.packageId,
					db.select({ id: packages.id })
						.from(packages)
						.innerJoin(programs, eq(packages.programId, programs.id))
						.where(inArray(programs.academicId, ids))
				))

			// 2. Delete coach related tables
			await tx.delete(coachSpokenLanguage)
				.where(inArray(coachSpokenLanguage.coachId,
					db.select({ id: coaches.id })
						.from(coaches)
						.where(inArray(coaches.academicId, ids))
				))

			await tx.delete(coachSport)
				.where(inArray(coachSport.coachId,
					db.select({ id: coaches.id })
						.from(coaches)
						.where(inArray(coaches.academicId, ids))
				))

			await tx.delete(coachPackage)
				.where(inArray(coachPackage.coachId,
					db.select({ id: coaches.id })
						.from(coaches)
						.where(inArray(coaches.academicId, ids))
				))

			await tx.delete(coachProgram)
				.where(inArray(coachProgram.coachId,
					db.select({ id: coaches.id })
						.from(coaches)
						.where(inArray(coaches.academicId, ids))
				))

			await tx.delete(coaches)
				.where(inArray(coaches.academicId, ids))

			await tx.delete(entryFeesHistory)
				.where(inArray(entryFeesHistory.programId,
					db.select({ id: programs.id })
						.from(programs)
						.where(inArray(programs.academicId, ids))
				))

			// 3. Delete schedule and package related tables
			await tx.delete(schedules)
				.where(inArray(schedules.packageId,
					db.select({ id: packages.id })
						.from(packages)
						.innerJoin(programs, eq(packages.programId, programs.id))
						.where(inArray(programs.academicId, ids))
				))

			await tx.delete(packages)
				.where(inArray(packages.programId,
					db.select({ id: programs.id })
						.from(programs)
						.where(inArray(programs.academicId, ids))
				))

			// 4. Delete block related tables
			await tx.delete(blockPrograms)
				.where(inArray(blockPrograms.blockId,
					db.select({ id: blocks.id })
						.from(blocks)
						.where(inArray(blocks.academicId, ids))
				))

			await tx.delete(blockPackages)
				.where(inArray(blockPackages.blockId,
					db.select({ id: blocks.id })
						.from(blocks)
						.where(inArray(blocks.academicId, ids))
				))

			await tx.delete(blockSports)
				.where(inArray(blockSports.blockId,
					db.select({ id: blocks.id })
						.from(blocks)
						.where(inArray(blocks.academicId, ids))
				))

			await tx.delete(blockBranches)
				.where(inArray(blockBranches.blockId,
					db.select({ id: blocks.id })
						.from(blocks)
						.where(inArray(blocks.academicId, ids))
				))

			await tx.delete(blocks)
				.where(inArray(blocks.academicId, ids))

			// 5. Delete branch related tables
			await tx.delete(branchSport)
				.where(inArray(branchSport.branchId,
					db.select({ id: branches.id })
						.from(branches)
						.where(inArray(branches.academicId, ids))
				))

			await tx.delete(branchFacility)
				.where(inArray(branchFacility.branchId,
					db.select({ id: branches.id })
						.from(branches)
						.where(inArray(branches.academicId, ids))
				))

			await tx.delete(branchTranslations)
				.where(inArray(branchTranslations.branchId,
					db.select({ id: branches.id })
						.from(branches)
						.where(inArray(branches.academicId, ids))
				))

			await tx.delete(branches)
				.where(inArray(branches.academicId, ids))

			// 6. Delete remaining academic related tables
			await tx.delete(academicAthletic)
				.where(inArray(academicAthletic.academicId, ids))

			await tx.delete(academicSport)
				.where(inArray(academicSport.academicId, ids))

			await tx.delete(academicTranslations)
				.where(inArray(academicTranslations.academicId, ids))

			await tx.delete(promoCodes)
				.where(inArray(promoCodes.academicId, ids))

			await tx.delete(wishlist)
				.where(inArray(wishlist.academicId, ids))

			// 7. Finally, delete the academics
			await tx.delete(academics)
				.where(inArray(academics.id, ids))
		})

		revalidatePath('/admin/academics')

		return {
			data: 'Successfully deleted academics and all related records',
			error: null,
		}
	} catch (error) {
		console.error('Error deleting academics:', error)
		return {
			data: null,
			error: 'Failed to delete academics. Please try again.',
		}
	}
}

export const acceptAcademic = async (id: number) => {
	const isAdminRes = await isAdmin()

	if (!isAdminRes) return {
		error: 'You are not authorized to perform this action',
	}

	await db.update(academics).set({ status: 'accepted', onboarded: false }).where(eq(academics.id, id))

	revalidatePath('/admin/academics')

	return {
		error: null,
	}
}

export const rejectAcademic = async (id: number) => {
	const isAdminRes = await isAdmin()

	if (!isAdminRes) return {
		error: 'You are not authorized to perform this action',
	}

	await db.update(academics).set({ status: 'rejected' }).where(eq(academics.id, id))

	revalidatePath('/admin/academics')

	return {
		error: null,
	}
}

export async function createAcademy(data: z.infer<typeof academySignUpSchema>) {
	try {

		const existingUser = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.email, data.email)
		})

		if (existingUser) {
			return { error: "User already exists" }
		}

		const slug = data.academyName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)+/g, '')

		const existingAcademy = await db.query.academics.findFirst({
			where: (academics, { eq }) => eq(academics.slug, slug)
		})

		if (existingAcademy) {
			return { error: "An academy with this name already exists" }
		}

		const hashedPassword = await bcrypt.hash(data.password, 10)

		const [newUser] = await db
			.insert(users)
			.values({
				email: data.email,
				name: data.fullName,
				password: hashedPassword,
				role: 'academic',
				isAthletic: false
			})
			.returning({
				id: users.id
			})

		if (!newUser?.id) {
			throw new Error("Failed to create user")
		}

		const [newAcademy] = await db
			.insert(academics)
			.values({
				slug,
				entryFees: parseFloat(data.entryFees ?? '0'),
				userId: newUser.id,
				status: 'pending',
				onboarded: false,
				createdAt: sql`now()`,
			})
			.returning({
				id: academics.id
			})

		if (!newAcademy?.id) {
			await db.delete(users).where(sql`id = ${newUser.id}`)
			throw new Error("Failed to create academy")
		}

		await db.insert(academicTranslations).values({
			academicId: newAcademy.id,
			locale: 'en',
			name: data.academyName,
			description: data.academyDescription,
		})

		return { success: true }
	} catch (error) {
		console.error('Academy signup error:', error)
		return { error: "Something went wrong" }
	}
}

export const getCalendarSlots = async (startDate: Date, endDate: Date) => {
	if (!startDate || !endDate) return { error: 'Start and end dates are required', data: [] }
	if (isNaN(startDate.getTime())) return { error: 'Start date cannot be 0', data: [] }
	if (isNaN(endDate.getTime())) return { error: 'End date cannot be 0', data: [] }
	if (startDate.getTime() === endDate.getTime()) return { error: 'Start and end dates cannot be the same', data: [] }
	if (startDate > endDate) return { error: 'Start date cannot be greater than end date', data: [] }

	const session = await auth()

	if (!session?.user) {
		return { error: 'You are not authorized to perform this action', data: [] }
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
		return { error: 'You are not authorized to perform this action', data: [] }
	}

	const academy = await db.query.academics.findFirst({
		where: (academics, { eq }) => eq(academics.userId, academicId),
		columns: {
			id: true,
		}
	})

	if (!academy) {
		return { error: 'Academy not found', data: [] }
	}

	const formattedStartDate = startDate.toISOString().split('T')[0]
	const formattedEndDate = endDate.toISOString().split('T')[0]

	// Fetch regular bookings
	const bookingsData = await db
		.select({
			id: bookingSessions.id,
			date: bookingSessions.date,
			startTime: bookingSessions.from,
			endTime: bookingSessions.to,
			status: bookingSessions.status,
			programName: programs.name,
			studentName: profiles.name,
			studentBirthday: profiles.birthday,
			branchName: branchTranslations.name,
			sportName: sportTranslations.name,
			packageName: packages.name,
			coachName: coaches.name,
			packageId: packages.id,
			coachId: coaches.id,
			color: programs.color,
			gender: programs.gender
		})
		.from(bookingSessions)
		.innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
		.innerJoin(profiles, eq(bookings.profileId, profiles.id))
		.innerJoin(packages, eq(bookings.packageId, packages.id))
		.innerJoin(programs, eq(packages.programId, programs.id))
		.leftJoin(coaches, eq(bookings.coachId, coaches.id))
		.innerJoin(branches, eq(programs.branchId, branches.id))
		.innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
		.innerJoin(sports, eq(programs.sportId, sports.id))
		.innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
		.where(
			and(
				sql`DATE(${bookingSessions.date}) >= DATE(${formattedStartDate})`,
				sql`DATE(${bookingSessions.date}) <= DATE(${formattedEndDate})`,
				eq(programs.academicId, academy.id)
			)
		);
	console.log("academicId", academicId)

	// Fetch blocks
	const blocksData = await db
		.select({
			id: blocks.id,
			date: blocks.date,
			startTime: blocks.startTime,
			endTime: blocks.endTime,
			branchName: branchTranslations.name,
			sportName: sportTranslations.name,
			packageName: packages.name,
			packageId: packages.id,
			gender: programs.gender
		})
		.from(blocks)
		.leftJoin(blockBranches, eq(blocks.id, blockBranches.blockId))
		.leftJoin(branches, eq(blockBranches.branchId, branches.id))
		.leftJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
		.leftJoin(blockSports, eq(blocks.id, blockSports.blockId))
		.leftJoin(sports, eq(blockSports.sportId, sports.id))
		.leftJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
		.leftJoin(blockPackages, eq(blocks.id, blockPackages.blockId))
		.leftJoin(packages, eq(blockPackages.packageId, packages.id))
		.leftJoin(blockPrograms, eq(blocks.id, blockPrograms.blockId))
		.leftJoin(programs, and(eq(packages.programId, programs.id), eq(programs.id, blockPrograms.programId)))
		.innerJoin(academics, eq(academics.id, blocks.academicId))
		.where(
			and(
				sql`DATE(${blocks.date}) >= DATE(${formattedStartDate})`,
				sql`DATE(${blocks.date}) <= DATE(${formattedEndDate})`,
				eq(academics.userId, academicId)
			)
		);

	// Transform blocks data to match booking format
	const transformedBlocks = blocksData.map(block => ({
		...block,
		status: 'blocked',
		programName: 'block',
		studentName: null,
		studentBirthday: null,
		color: '#F5F5F5',
		coachName: null,
		coachId: null,
	}));


	console.log("bookingsData", bookingsData)

	return {
		data: [...bookingsData, ...transformedBlocks],
		error: null,
	}
}

export const getAcademicsSports = async () => {
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

	if (!academy) return { error: 'Academy not found' }

	const data = await db
		.select({
			id: sports.id,
			image: sports.image,
			name: sql<string>`t.name`,
			locale: sql<string>`t.locale`,
		})
		.from(academicSport)
		.innerJoin(sports, eq(academicSport.sportId, sports.id))
		.innerJoin(
			sql`(
          SELECT st.sport_id, st.name, st.locale
          FROM ${sportTranslations} st
          WHERE st.locale = 'en'
          UNION
          SELECT st2.sport_id, st2.name, st2.locale
          FROM ${sportTranslations} st2
          INNER JOIN (
            SELECT sport_id, MIN(locale) as first_locale
            FROM ${sportTranslations}
            WHERE sport_id NOT IN (
              SELECT sport_id 
              FROM ${sportTranslations} 
              WHERE locale = 'en'
            )
            GROUP BY sport_id
          ) first_trans ON st2.sport_id = first_trans.sport_id 
          AND st2.locale = first_trans.first_locale
        ) t`,
			sql`t.sport_id = ${sports.id}`
		)
		.where(eq(academicSport.academicId, academy.id));

	return {
		data,
		error: null,
	}
}

export const getAllSports = async (url: string | null) => {
	if (!url) return
	return await db
		.select({
			id: sports.id,
			image: sports.image,
			name: sql<string>`t.name`,
			locale: sql<string>`t.locale`,
		})
		.from(sports)
		.innerJoin(
			sql`(
			SELECT st.sport_id, st.name, st.locale
			FROM ${sportTranslations} st
			WHERE st.locale = 'en'
			UNION
			SELECT st2.sport_id, st2.name, st2.locale
			FROM ${sportTranslations} st2
			INNER JOIN (
				SELECT sport_id, MIN(locale) as first_locale
				FROM ${sportTranslations}
				WHERE sport_id NOT IN (
					SELECT sport_id 
					FROM ${sportTranslations} 
					WHERE locale = 'en'
				)
				GROUP BY sport_id
			) first_trans ON st2.sport_id = first_trans.sport_id 
			AND st2.locale = first_trans.first_locale
		) t`,
			sql`t.sport_id = ${sports.id}`
		)
}

export const getAcademySportsStore = async () => {
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

	if (!academy) return { error: 'Academy not found', field: null, data: [] }

	const sportsData = await db
		.select({
			id: sports.id,
			image: sports.image,
			name: sql<string>`t.name`,
			locale: sql<string>`t.locale`,
		})
		.from(academicSport)
		.innerJoin(sports, eq(academicSport.sportId, sports.id))
		.innerJoin(
			sql`(
			SELECT st.sport_id, st.name, st.locale
			FROM ${sportTranslations} st
			WHERE st.locale = 'en'
			UNION
			SELECT st2.sport_id, st2.name, st2.locale
			FROM ${sportTranslations} st2
			INNER JOIN (
				SELECT sport_id, MIN(locale) as first_locale
				FROM ${sportTranslations}
				WHERE sport_id NOT IN (
					SELECT sport_id 
					FROM ${sportTranslations} 
					WHERE locale = 'en'
				)
				GROUP BY sport_id
			) first_trans ON st2.sport_id = first_trans.sport_id 
			AND st2.locale = first_trans.first_locale
		) t`,
			sql`t.sport_id = ${sports.id}`
		)
		.where(eq(academicSport.academicId, academy.id));

	return {
		data: sportsData,
		error: null,
		field: null
	}
}

export const addSports = async (sportsIds: number[]) => {
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

	try {

		if (!academy) return { error: 'Academy not found' }

		await Promise.all(sportsIds.map(async (id) => await db.insert(academicSport).values({ academicId: academy.id, sportId: id })))

		revalidatePath('/academy/sports')
	} catch (error) {
		console.error('Error creating location:', error)
		if ((error as any)?.code === '23505' && (error as any)?.constraint === 'branches_slug_unique') {
			return {
				error: 'A location with this name already exists',
				field: 'name'
			}
		}
		return { error: 'Failed to create location' }
	}
}

export const deleteSport = async (id: number) => {
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

	if (!academy) return { error: 'Academy not found' }

	await db.delete(academicSport).where(and(eq(academicSport.academicId, academy.id), eq(academicSport.sportId, id)))

	revalidatePath('/academy/sports')
}

type UpdateAcademyDetailsInput = z.infer<typeof academyDetailsSchema> & {
	sports: number[]
}

export async function updateAcademyDetails(data: UpdateAcademyDetailsInput) {
	try {
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
			return {
				error: 'Academy not found',
				field: 'root'
			}
		}

		const [existingSports, existingGallery] = await Promise.all([
			db
				.select({ sportId: academicSport.sportId })
				.from(academicSport)
				.where(eq(academicSport.academicId, academy.id)),

			db
				.select({ url: media.url })
				.from(media)
				.where(and(
					eq(media.referableId, academy.id),
				))
		])

		const existingSportIds = existingSports.map(s => s.sportId)
		const existingGalleryUrls = existingGallery.map(g => g.url)

		const finalExistingGalleryUrls = await Promise.all(existingGalleryUrls.map(async url => {
			const image = await getImageUrl(url)
			return image
		}))

		const sportsToAdd = data.sports.filter(id => !existingSportIds.includes(id))
		const sportsToRemove = existingSportIds.filter(id => !data.sports.includes(id))
		const galleryToAdd = data.gallery.filter(url => !finalExistingGalleryUrls.includes(url))
		const galleryToRemove = finalExistingGalleryUrls.filter(url => !data.gallery.includes(url!)).map(url => url?.includes('images/') ? url?.startsWith('images/') ? url : 'images/' + url?.split('images/')[1] : 'images/' + url) as string[]

		console.log("Gallery to remove", galleryToRemove)
		console.log("Data Gallery", data.gallery)
		console.log("Final Gallery", finalExistingGalleryUrls)

		await db.transaction(async (tx) => {
			await tx
				.update(academics)
				.set({
					policy: data.policy,
					entryFees: data.entryFees,
					extra: data.extra,
					image: data.logo?.includes('images/') ? data.logo?.startsWith('images/') ? data.logo : 'images/' + data.logo?.split('images/')[1] : 'images/' + data.logo,
					updatedAt: sql`now()`
				})
				.where(eq(academics.id, academy.id))

			await tx
				.update(academicTranslations)
				.set({
					name: data.name,
					description: data.description,
					updatedAt: sql`now()`
				})
				.where(and(
					eq(academicTranslations.academicId, academy.id),
					eq(academicTranslations.locale, 'en')
				))

			await Promise.all([
				sportsToRemove.length > 0 ?
					tx.delete(academicSport)
						.where(and(
							eq(academicSport.academicId, academy.id),
							inArray(academicSport.sportId, sportsToRemove)
						)) : Promise.resolve(),

				sportsToAdd.length > 0 ?
					tx.insert(academicSport)
						.values(sportsToAdd.map(sportId => ({
							academicId: academy.id,
							sportId,
							createdAt: sql`now()`,
							updatedAt: sql`now()`
						}))) : Promise.resolve()
			])

			await Promise.all([
				galleryToRemove.length > 0 ?
					tx.delete(media)
						.where(and(
							eq(media.referableId, academy.id),
							inArray(media.url, galleryToRemove)
						)) : Promise.resolve(),

				galleryToAdd.length > 0 ?
					tx.insert(media)
						.values(galleryToAdd.map(url => ({
							referableId: academy.id,
							referableType: 'App\\Models\\Academic',
							url: 'images/' + url,
							type: url.toLowerCase().endsWith('.mp4') ? '1' : '0',
							createdAt: sql`now()`,
							updatedAt: sql`now()`
						}))) : Promise.resolve()
			])
		})

		revalidatePath('/dashboard/academy')
		return { success: true }

	} catch (error) {
		console.error('Error updating academy details:', error)

		if (error instanceof Error) {
			return {
				error: error.message,
				field: 'root'
			}
		}

		return {
			error: 'Something went wrong while updating academy details',
			field: 'root'
		}
	}
}

export const getAcademySports = async () => {
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

	if (!academy) return { error: 'Academy not found' }

	const data = await db
		.select({
			id: sports.id,
		})
		.from(academicSport)
		.innerJoin(sports, eq(academicSport.sportId, sports.id))
		.where(eq(academicSport.academicId, academy.id));

	return {
		data,
		error: null,
	}
}