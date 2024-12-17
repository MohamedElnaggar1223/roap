import { AcadenyDetailsSidebar } from "@/components/academy/academy-details/Sidebar";
import { checkAcademyStatus } from "@/lib/actions/check-academy-status";
import { redirect } from "next/navigation";

export default async function RootAcademyLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    const status = await checkAcademyStatus()

    if (status.shouldRedirect) {
        return redirect(status.redirectTo!)
    }

    return (
        <section className='flex w-full h-full'>
            <AcadenyDetailsSidebar onboarded={!!status.isOnboarded} />
            {children}
        </section>
    )
}