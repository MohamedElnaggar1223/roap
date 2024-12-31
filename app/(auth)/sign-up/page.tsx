import { auth } from "@/auth"
import SignUp from "@/components/academy/auth/SignUp"
import { checkAcademyStatus } from "@/lib/actions/check-academy-status"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
    const session = await auth()

    const status = await checkAcademyStatus()

    if (session?.user && !status.logout) return redirect("/")

    return <SignUp />
}