import { auth } from "@/auth";
import SignIn from "@/components/academy/auth/SignIn";
import { redirect } from "next/navigation";

export default async function SignInPage() {
    const session = await auth()

    if(session?.user) return redirect("/")

    return <SignIn />
}