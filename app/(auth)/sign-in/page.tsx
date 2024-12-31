import { auth } from "@/auth";
import SignIn from "@/components/academy/auth/SignIn";
import { checkAcademyStatus } from "@/lib/actions/check-academy-status";
import { redirect } from "next/navigation";

export default async function SignInPage() {
    const session = await auth()

    const status = await checkAcademyStatus()

    if (session?.user && !status.logout) return redirect("/")

    return <SignIn />
}