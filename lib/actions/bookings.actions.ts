'use server'
import { auth } from "@/auth"
import { db } from "@/db"
import { bookings } from "@/db/schema"
import { inArray } from "drizzle-orm"
import { revalidateTag } from "next/cache"

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