import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Roap",
	description: "Roap is a platform for athletes to share their training plans and achievements.",
}

const geistFont = localFont({ src: '../public/fonts/GeistVF.woff', variable: '--font-geist' })

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={cn(`antialiased`, geistFont.variable)}
			>
				{children}
			</body>
		</html>
	)
}
