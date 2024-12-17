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
import { Loader2, LogOut } from 'lucide-react'
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog-no-close"
import { signOut } from 'next-auth/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AcademySidebar({ onboarded, ...props }: React.ComponentProps<typeof Sidebar> & { onboarded: boolean }) {
    const pathname = usePathname()

    const [loading, setLoading] = React.useState(false)

    const handleLogOut = async () => {
        setLoading(true)
        await signOut({ redirect: true, redirectTo: '/' })
        setLoading(false)
    }

    const DisabledLinkWrapper = ({ children, href }: { children: React.ReactNode, href: string }) => {
        if (onboarded) {
            return <Link href={href} className="h-10 rounded-[12px] overflow-hidden">{children}</Link>
        }
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="h-10 rounded-[12px] overflow-hidden cursor-not-allowed">
                            {children}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Finish onboarding first</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
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
                        <DisabledLinkWrapper href="/">
                            <SidebarMenuButton disabled={!onboarded} className={cn('h-full text-sm', pathname === '/' && 'bg-[#F1F2E9]')} tooltip='Dashboard'>
                                <Image src='/images/dashboard.svg' width={20} height={20} alt='dashboard' />
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href="/calendar">
                            <SidebarMenuButton disabled={!onboarded} className={cn('h-full text-sm', pathname?.includes('/calendar') && 'bg-[#F1F2E9]')} tooltip='Calendar'>
                                <Image src='/images/calendar.svg' width={20} height={20} alt='calendar' />
                                <span>Calendar</span>
                            </SidebarMenuButton>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href="/athletes">
                            <SidebarMenuButton disabled={!onboarded} className={cn('h-full text-sm', pathname?.includes('/athletes') && 'bg-[#F1F2E9]')} tooltip='Athletes'>
                                <Image src='/images/athletes.svg' width={20} height={20} alt='athletes' />
                                <span>Athletes</span>
                            </SidebarMenuButton>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href="/payment">
                            <SidebarMenuButton disabled={!onboarded} className={cn('h-full text-sm', pathname?.includes('/payment') && 'bg-[#F1F2E9]')} tooltip='Payments'>
                                <Image src='/images/payment.svg' width={20} height={20} alt='payment' />
                                <span>Payments</span>
                            </SidebarMenuButton>
                        </DisabledLinkWrapper>
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

