'use server'
import { db } from "@/db"
import { users } from "@/db/schema"
import { academics } from "@/db/schema"
import { eq } from "drizzle-orm"
import { signIn as nextAuthSignIn } from "@/auth"

type SignInInput = {
    email: string
    password: string
}

export async function signIn(data: SignInInput) {
    try {
        // First check if the user exists and get their role
        const user = await db.query.users.findFirst({
            where: eq(users.email, data.email),
            columns: {
                id: true,
                role: true,
            }
        })

        if (!user) {
            return { error: "User not found" }
        }

        // If user is an academic, check their status
        if (user.role === 'academic') {
            const academy = await db.query.academics.findFirst({
                where: eq(academics.userId, user.id),
                columns: {
                    status: true
                }
            })

            if (!academy) {
                return { error: "Academy not found" }
            }

            // Check academy status
            if (academy.status === 'pending') {
                return { error: "pending" }
            }

            if (academy.status === 'rejected') {
                return { error: "rejected" }
            }
        }

        // If all checks pass, attempt to sign in
        const result = await nextAuthSignIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        })

        if (result?.error) {
            return { error: "Invalid credentials" }
        }

        return { success: true }

    } catch (error) {
        console.error("Sign in error:", error)
        return { error: "Something went wrong" }
    }
}