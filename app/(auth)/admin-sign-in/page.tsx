import { LoginForm } from "@/components/admin/LoginForm"
import { isAdmin } from "@/lib/admin"
import { redirect } from "next/navigation"

export default async function AdminSignInPage() {
    const admin = await isAdmin()
    if (admin) return redirect('/admin')

    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <LoginForm />
        </div>
    )
}