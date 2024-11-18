"use client"

import * as React from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenuButton,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Loader2, LogOut } from "lucide-react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog-no-close";
import { signOut } from 'next-auth/react';

export function AcademySidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    const [loading, setLoading] = React.useState(false)

    const handleLogOut = async () => {
        setLoading(true)
        await signOut({ redirect: true, redirectTo: '/' })
        setLoading(false)
    }

    return (
        <>
            <Sidebar className='font-medium bg-[#E0E4D9] border-[#CDD1C7]' collapsible="icon" {...props}>
                <SidebarHeader className='bg-[#E0E4D9]'>
                    <Image
                        src="/images/roapLogo.svg"
                        alt="Logo"
                        width={66}
                        height={42}
                        className='mx-auto'
                    />
                </SidebarHeader>
                <SidebarContent className="bg-[#E0E4D9]">
                    <SidebarGroup className='space-y-2'>
                        <Link href='/academy' className='h-10 rounded-[12px] overflow-hidden'>
                            <SidebarMenuButton className={cn('h-full text-sm', pathname?.includes('/academy') && 'bg-[#F1F2E9]')} tooltip='Academy'>
                                <Image src='/images/academy.svg' width={20} height={20} alt='academy' />
                                <span>Academy</span>
                            </SidebarMenuButton>
                        </Link>
                        <Link href='/' className='h-10 rounded-[12px] overflow-hidden'>
                            <SidebarMenuButton className={cn('h-full text-sm', pathname === '/' && 'bg-[#F1F2E9]')} tooltip='Academy'>
                                <Image src='/images/dashboard.svg' width={20} height={20} alt='dashboard' />
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </Link>
                        <Link href='/calendar' className='h-10 rounded-[12px] overflow-hidden'>
                            <SidebarMenuButton className={cn('h-full text-sm', pathname?.includes('/calendar') && 'bg-[#F1F2E9]')} tooltip='Academy'>
                                <Image src='/images/calendar.svg' width={20} height={20} alt='calendar' />
                                <span>Calendar</span>
                            </SidebarMenuButton>
                        </Link>
                        <Link href='/athletes' className='h-10 rounded-[12px] overflow-hidden'>
                            <SidebarMenuButton className={cn('h-full text-sm', pathname?.includes('/athletes') && 'bg-[#F1F2E9]')} tooltip='Academy'>
                                <Image src='/images/athletes.svg' width={20} height={20} alt='athletes' />
                                <span>Athletes</span>
                            </SidebarMenuButton>
                        </Link>
                        <Link href='/payment' className='h-10 rounded-[12px] overflow-hidden'>
                            <SidebarMenuButton className={cn('h-full text-sm', pathname?.includes('/payment') && 'bg-[#F1F2E9]')} tooltip='Academy'>
                                <Image src='/images/payment.svg' width={20} height={20} alt='payment' />
                                <span>Payment</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className='bg-[#E0E4D9]'>
                    <div onClick={handleLogOut} className='flex py-2 cursor-pointer text-sm items-center justify-center gap-1'>
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </div>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <Dialog open={loading}>
                <DialogContent className='flex items-center justify-center bg-transparent border-none shadow-none outline-none'>
                    <DialogTitle />
                    <Loader2 className='animate-spin' size={42} color="#000" />
                </DialogContent>
            </Dialog>
        </>
    )
}
