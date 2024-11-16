import { AdminSidebar } from "@/components/admin/Sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import localFont from 'next/font/local'
import AdminHeader from "@/components/admin/AdminHeader"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { cn } from "@/lib/utils"
import { isAdmin } from "@/lib/admin"
import "../../globals.css"

const geistFont = localFont({ src: '../../../public/fonts/GeistVF.woff', variable: '--font-geist' })

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth()

    if (!session?.user?.id) return redirect('/admin-sign-in')

    const isAdminRes = await isAdmin()

    if(!isAdminRes) return redirect('/admin-sign-in')

    return (
        <html lang='en'>
            <body>
                <SidebarProvider className={cn(geistFont.className, geistFont.variable)}>
                    <AdminSidebar />
                    <main className='flex flex-col flex-1'>
                        <AdminHeader>
                            <section className='p-8'>
                                {children}
                            </section>
                        </AdminHeader>
                    </main>
                </SidebarProvider>
            </body>
        </html>
    )
}