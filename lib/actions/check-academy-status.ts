'use server'

import { db } from '@/db';
import { academics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { signOut } from '@/auth';

export async function checkAcademyStatus() {
    const session = await auth()

    if (session?.user?.role === 'admin') {
        console.log("Admin entered")
        const cookieStore = await cookies()
        const impersonatedId = session.user.role === 'admin'
            ? cookieStore.get('impersonatedAcademyId')?.value
            : null

        // Build the where condition based on user role and impersonation
        const academicId = session.user.role === 'admin' && impersonatedId
            ? parseInt(impersonatedId)
            : parseInt(session.user.id)

        const academy = await db.query.academics.findFirst({
            where: eq(academics.userId, academicId),
            columns: {
                id: true,
                slug: true
            }
        })

        function slugToText(slug: string) {
            return slug
                // Replace hyphens with spaces
                .replace(/-/g, ' ')
                // Capitalize first letter of each word
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        console.log("Academy", academy)

        if (!academy) {
            return {
                shouldRedirect: false,
            }
        }

        return {
            shouldRedirect: false,
            isOnboarded: true,
            academyId: academy.id,
            isAdmin: true,
            academyName: slugToText(academy.slug)
        }
    }

    console.log(session)

    if (!session?.user) {
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

    console.log("Academy", academy)

    if (!academy) {
        if (session.user.id) {
            return {
                shouldRedirect: true,
                redirectTo: '/sign-in',
                logout: true
            }
        }

        return {
            shouldRedirect: true,
            redirectTo: '/sign-in'
        }
    }

    return {
        shouldRedirect: false,
        isOnboarded: academy.onboarded,
        status: academy.status,
        academyId: academy.id
    }
}