import { AdminSidebar } from "@/components/admin/Sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import localFont from 'next/font/local'
import AdminHeader from "@/components/admin/AdminHeader"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin"

const geistFont = localFont({ src: '../../public/fonts/GeistVF.woff' })

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) 
{
    const session = await auth.api.getSession({
        headers: await headers()
    })

    console.log(session)

    if (!session?.user?.id) return redirect('/admin-sign-in')

    const admin = await isAdmin()

    console.log(admin)

	return (
		<SidebarProvider className={geistFont.className}>
            <AdminSidebar />
            <main className='flex flex-col flex-1'>
                <AdminHeader>
                    {children}
                </AdminHeader>
            </main>
        </SidebarProvider>
	)
}