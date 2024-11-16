'use server'

import { SQL, and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { academics, academicTranslations, bookings, bookingSessions, branches, branchTranslations, coaches, packages, profiles, programs, sports, sportTranslations, users } from '@/db/schema'
// import { auth } from '../auth'
import bcrypt from "bcryptjs";
import { headers } from 'next/headers'
import { isAdmin } from '../admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import { academySignUpSchema } from '../validations/auth';

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
      })
      .$returningId()

    if (!newUser?.id) {
      throw new Error("Failed to create user")
    }

    const [newAcademy] = await db
      .insert(academics)
      .values({
        id: sql`DEFAULT`,
        slug,
        entryFees: parseFloat(data.entryFees),
        userId: newUser.id,
        status: 'pending',
      })
      .$returningId()

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

  const allEvents = await db
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

  console.log('allEvents: ', allEvents)

  const filteredEvents = await db
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

  console.log('filteredEvents: ', filteredEvents)

    return filteredEvents;
}