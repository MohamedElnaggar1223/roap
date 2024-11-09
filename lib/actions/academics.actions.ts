'use server'

import { SQL, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { academics, users } from '@/db/schema'
import { auth } from '../auth'
import { headers } from 'next/headers'

export async function getPaginatedAcademics(
  page: number = 1,
  pageSize: number = 10,
  orderBy: SQL = asc(academics.id)
) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    
    const mockAcademicsData = [
        {
          id: 1,
          slug: "intro-to-computer-science",
          policy: "This course requires a basic understanding of mathematics and logic.",
          entryFees: 250.00,
          userId: 101,
          userName: "Alice Johnson",
          status: 'pending'
        },
        {
          id: 2,
          slug: "data-science-basics",
          policy: "Enrollment in this course requires a background in Python programming.",
          entryFees: 300.00,
          userId: 102,
          userName: "Bob Smith",
          status: 'accepted'
        },
        {
          id: 3,
          slug: "web-development",
          policy: "This course is open to all skill levels, from beginner to advanced.",
          entryFees: 200.00,
          userId: 103,
          userName: "Charlie Brown",
          status: 'rejected'
        },
        {
          id: 4,
          slug: "advanced-machine-learning",
          policy: "Participants should have prior knowledge of linear algebra and Python.",
          entryFees: 500.00,
          userId: 104,
          userName: "Diana Prince",
          status: 'pending'
        },
        {
          id: 5,
          slug: "introduction-to-cybersecurity",
          policy: "This course is designed for beginners with no prior experience in cybersecurity.",
          entryFees: 350.00,
          userId: 105,
          userName: "Evan Stone",
          status: 'pending'
        },
      ];  

    if(!session) return {
        data: mockAcademicsData as {
            id: number;
            slug: string;
            policy: string;
            entryFees: number;
            userId: number;
            userName: string;
            status: 'pending' | 'accepted' | 'rejected';
        }[],
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
        userName: users.name, // Assuming there's a 'name' column in the users table
    })
    .from(academics)
    .leftJoin(users, eq(academics.userId, users.id))
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