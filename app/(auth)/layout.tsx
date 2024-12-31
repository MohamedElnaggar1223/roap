import type { Metadata } from "next";
import "../globals.css";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkAcademyStatus } from "@/lib/actions/check-academy-status";

export const metadata: Metadata = {
	title: "Roap",
	description: "Roap is a platform for athletes to share their training plans and achievements.",
}

const geistFont = localFont({ src: '../../public/fonts/GeistVF.woff', variable: '--font-geist' })

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth()
	const status = await checkAcademyStatus()

	if (session?.user && !status.logout) return redirect("/")

	return (
		<html lang="en">
			<body
				className={cn(`antialiased`, geistFont.variable)}
			>
				{children}
				<Toaster />
			</body>
		</html>
	)
}
