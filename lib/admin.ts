'use server'

import { db } from "@/db";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function isAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session?.user?.id) {
        return false;
    }


    return session.user.role === 'admin'
}