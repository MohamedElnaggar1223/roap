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
 
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth()

	if(!session?.user) return redirect("/sign-in") 

	return (
		<html lang="en">
			<body
				className={cn(`antialiased bg-[#E0E4D9]`, inter.variable)}
			>
				<SidebarProvider className='font-inter bg-[#E0E4D9]'>
					<AcademySidebar />
                    <main className='flex flex-col flex-1 font-inter bg-[#E0E4D9]'>
                        <AcademyHeader>
                            <section className='p-8 bg-[#E0E4D9] h-full'>
                                {children}
								<Toaster />
                            </section>
                        </AcademyHeader>
                    </main>
				</SidebarProvider>
			</body>
		</html>
	)
}
