import { auth } from "@/auth"
import SignUp from "@/components/academy/auth/SignUp"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
    const session = await auth()

    if(session?.user) return redirect("/")
    
    return <SignUp />
}