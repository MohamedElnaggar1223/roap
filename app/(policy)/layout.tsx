import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";

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

    return (
        <html lang="en">
            <body
                className={cn(`antialiased bg-[#E0E4D9]`, inter.variable)}
            >
                <main className='flex flex-col flex-1 font-inter bg-[#E0E4D9]'>
                    <section className='p-4 bg-[#E0E4D9] h-full'>
                        {children}
                    </section>
                </main>
            </body>
        </html>
    )
}
