import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db";
import { users } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string
            role: UserRole
            // Extend with other custom fields
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        // Extend with other custom fields
    }
}

// lib/types.ts
export type UserRole = 'admin' | 'academic' | 'user'

export const { auth, handlers, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials.email || !credentials.password) throw new Error('Missing credentials');

                if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') throw new Error('Invalid credentials');

                const user = await db.query.users.findFirst({
                    where: eq(sql`lower(${users.email})`, credentials.email.toLowerCase()),
                    columns: {
                        id: true,
                        email: true,
                        name: true,
                        password: true,
                        role: true
                    }
                })

                if (!user || !user.password || !user.email || !user.name || !user.role) {
                    throw new Error('User not found');
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    throw new Error('Wrong password');
                }

                return {
                    id: user.id.toString(),
                    email: user.email!,
                    name: user.name!,
                    role: user.role!
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as 'admin' | 'academic' | 'user'
            }
            return session
        }
    },
    trustHost: true,
})