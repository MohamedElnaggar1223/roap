'use server'

import { db } from '@/db';
import { academics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function checkAcademyStatus() {
    const session = await auth()

    if (session?.user?.role === 'admin') {
        return {
            shouldRedirect: false,
            isOnboarded: true,
        }
    }

    if (!session?.user || session.user.role !== 'academic') {
        return {
            shouldRedirect: true,
            redirectTo: '/sign-in'
        }
    }

    const academy = await db.query.academics.findFirst({
        where: eq(academics.userId, parseInt(session.user.id)),
        columns: {
            id: true,
            onboarded: true,
            status: true
        }
    })

    if (!academy) {
        return {
            shouldRedirect: true,
            redirectTo: '/sign-in'
        }
    }

    return {
        shouldRedirect: false,
        isOnboarded: academy.onboarded,
        status: academy.status
    }
}