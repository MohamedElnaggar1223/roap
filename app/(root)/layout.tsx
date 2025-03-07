import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AcademySidebar } from "@/components/academy/Sidebar";
import AcademyHeader from "@/components/academy/AcademyHeader";

export const metadata: Metadata = {
	title: "Roap",
	description: "Roap is a platform for athletes to share their training plans and achievements.",
}

import { Inter } from 'next/font/google'
import { checkAcademyStatus } from "@/lib/actions/check-academy-status";
import { OnboardingProvider } from "@/providers/onboarding-provider";
import { OnboardingSaveProvider } from "@/providers/onboarding-save-provider";
import { StoreProvider } from "@/providers/store-provider";
import { DataPrefetcher } from "@/providers/data-prefetcher";
import Providers from "@/providers/query-provider";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const status = await checkAcademyStatus()

	console.log(status)
	console.log("status academy Id", status.academyId)

	if (status.shouldRedirect) {
		redirect(status.redirectTo!)
	}
	// if (!status.isOnboarded) {
	// 	redirect('/on-boarding')
	// }

	return (
		<html lang="en">
			<body
				className={cn(`antialiased bg-[#E0E4D9]`, inter.variable)}
			>
				<Providers>
					<StoreProvider>
						<DataPrefetcher>
							<OnboardingProvider onboarded={!!status.isOnboarded} isAdmin={!!status.isAdmin} academyName={status.isAdmin ? status.academyName : ''}>
								<OnboardingSaveProvider>
									<SidebarProvider className='font-inter bg-[#E0E4D9]'>
										<AcademySidebar onboarded={!!status.isOnboarded} />
										<main className='flex flex-col flex-1 font-inter bg-[#E0E4D9]'>
											<AcademyHeader academyId={status.academyId!}>
												<section className='p-4 bg-[#E0E4D9] h-full max-w-[100vw]'>
													{children}
													<Toaster />
												</section>
											</AcademyHeader>
										</main>
									</SidebarProvider>
								</OnboardingSaveProvider>
							</OnboardingProvider>
						</DataPrefetcher>
					</StoreProvider>
				</Providers>
			</body>
		</html>
	)
}
