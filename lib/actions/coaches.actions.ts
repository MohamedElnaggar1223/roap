'use server'

import { db } from '@/db'
import { coaches } from '@/db/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'

export async function getAllCoaches(url: string | null) {
    if (!url) return
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return null
    }

    // Get the academic's ID from the logged-in user
    const academic = await db.query.academics.findFirst({
        where: (academics, { eq }) => eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
        }
    })

    if (!academic) return null

    // Get all coaches for this academy
    const academyCoaches = await db
        .select({
            id: coaches.id,
            name: coaches.name,
            image: coaches.image,
            title: coaches.title,
            gender: coaches.gender,
            dateOfBirth: coaches.dateOfBirth,
        })
        .from(coaches)
        .where(eq(coaches.academicId, academic.id))

    return academyCoaches
}

export async function getCoachById(id: number) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'academic') {
        return { error: 'Unauthorized' }
    }

    const coach = await db.query.coaches.findFirst({
        where: (coaches, { eq }) => eq(coaches.id, id),
    })

    if (!coach) {
        return { error: 'Coach not found' }
    }

    return { data: coach }
}