import { AcadenyDetailsSidebar } from "@/components/academy/academy-details/Sidebar";

export default function RootAcademyLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <section className='flex w-full h-full'>
            <AcadenyDetailsSidebar />
            {children}
        </section>
    )
}