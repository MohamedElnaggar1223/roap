import { AdminSidebar } from "@/components/admin/Sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import localFont from 'next/font/local'
import AdminHeader from "@/components/admin/AdminHeader"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { cn } from "@/lib/utils"
// import { isAdmin } from "@/lib/admin"

const geistFont = localFont({ src: '../../public/fonts/GeistVF.woff', variable: '--font-geist' })

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth()

    if (!session?.user?.id) return redirect('/admin-sign-in')

    return (
        <SidebarProvider className={cn(geistFont.className, geistFont.variable)}>
            <AdminSidebar />
            <main className='flex flex-col flex-1'>
                <AdminHeader>
                    {children}
                </AdminHeader>
            </main>
        </SidebarProvider>
    )
}