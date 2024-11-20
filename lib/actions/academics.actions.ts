'use server'

import { SQL, and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { academics, academicSport, academicTranslations, bookings, bookingSessions, branches, branchTranslations, coaches, packages, profiles, programs, sports, sportTranslations, users } from '@/db/schema'
// import { auth } from '../auth'
import bcrypt from "bcryptjs";
import { headers } from 'next/headers'
import { isAdmin } from '../admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import { academySignUpSchema } from '../validations/auth';
import { auth } from '@/auth';

export async function getPaginatedAcademics(
	page: number = 1,
	pageSize: number = 10,
	orderBy: SQL = asc(academics.id)
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

	const [{ count }] = await db
		.select({ count: sql`count(*)`.mapWith(Number) })
		.from(academics)

	return {
		data,
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

	await db.delete(academics).where(inArray(academics.id, ids))

	revalidatePath('/admin/academics')
}

export const acceptAcademic = async (id: number) => {
	const isAdminRes = await isAdmin()

	if (!isAdminRes) return {
		error: 'You are not authorized to perform this action',
	}

	await db.update(academics).set({ status: 'accepted' }).where(eq(academics.id, id))

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
				entryFees: parseFloat(data.entryFees),
				userId: newUser.id,
				status: 'pending',
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

export const getCalendarSlots = async (
	startDate: Date,
	endDate: Date,
) => {

	const formattedStartDate = startDate.toISOString().split('T')[0]
	const formattedEndDate = endDate.toISOString().split('T')[0]

	return await db
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
		})
		.from(bookingSessions)
		.innerJoin(bookings, eq(bookingSessions.bookingId, bookings.id))
		.innerJoin(profiles, eq(bookings.profileId, profiles.id))
		.innerJoin(packages, eq(bookings.packageId, packages.id))
		.innerJoin(programs, eq(packages.programId, programs.id))
		.innerJoin(coaches, eq(bookings.coachId, coaches.id))
		.innerJoin(branches, eq(programs.branchId, branches.id))
		.innerJoin(branchTranslations, eq(branches.id, branchTranslations.branchId))
		.innerJoin(sports, eq(programs.sportId, sports.id))
		.innerJoin(sportTranslations, eq(sports.id, sportTranslations.sportId))
		.where(
			and(
				sql`DATE(${bookingSessions.date}) >= DATE(${formattedStartDate})`,
				sql`DATE(${bookingSessions.date}) <= DATE(${formattedEndDate})`
			)
		);
}

export const getAcademicsSports = async () => {
	const session = await auth()

	if (!session?.user || session.user.role !== 'academic') return { error: 'You are not authorized to perform this action' }

	const academy = await db.query.academics.findFirst({
		where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
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

export const addSports = async (sportsIds: number[]) => {
	const session = await auth()

	if (!session?.user || session.user.role !== 'academic') return { error: 'You are not authorized to perform this action' }

	try {
		const academy = await db.query.academics.findFirst({
			where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
			columns: {
				id: true,
			}
		})

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

	if (!session?.user || session.user.role !== 'academic') return { error: 'You are not authorized to perform this action' }

	const academy = await db.query.academics.findFirst({
		where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
		columns: {
			id: true,
		}
	})

	if (!academy) return { error: 'Academy not found' }

	await db.delete(academicSport).where(and(eq(academicSport.academicId, academy.id), eq(academicSport.sportId, id)))

	revalidatePath('/academy/sports')
}