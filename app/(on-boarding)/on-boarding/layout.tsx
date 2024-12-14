import { OnboardingProvider } from "@/providers/onboarding-provider"
import { redirect } from "next/navigation"
import TopBar from "@/components/on-boarding/top-bar"
import StepsProgress from "@/components/on-boarding/steps-progress"
import type { Metadata } from "next";
import "../../globals.css";
export const metadata: Metadata = {
    title: "Roap",
    description: "Roap is a platform for athletes to share their training plans and achievements.",
}

import { Inter } from 'next/font/google'
import { checkAcademyStatus } from "@/lib/actions/check-academy-status";
import { cn } from "@/lib/utils";
import { OnboardingSaveProvider } from "@/providers/onboarding-save-provider";
import { Toaster } from "@/components/ui/toaster";
import LogOutBtn from "@/components/on-boarding/logout-btn";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const status = await checkAcademyStatus()

    if (status.shouldRedirect) {
        redirect(status.redirectTo!)
    }

    if (status.isOnboarded) {
        redirect('/dashboard')
    }

    return (
        <html lang="en">
            <body className={cn(`antialiased bg-[#E0E4D9] !font-inter`, inter.variable)}>
                <OnboardingProvider>
                    <OnboardingSaveProvider>
                        <main className="flex flex-col w-full p-12">
                            <TopBar />
                            <div className="">
                                {children}
                            </div>
                            <LogOutBtn />
                            <Toaster />
                        </main>
                    </OnboardingSaveProvider>
                </OnboardingProvider>
            </body>
        </html>
    )
}