'use server'

import { auth, signIn } from "@/auth"
import { cache } from "react"

export const isAdmin = cache(async () => {
    const session = await auth()

    return session?.user?.role === 'admin'
})

export const signInAdmin = async (email: string, password: string) => {
    await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/admin'
    })
}