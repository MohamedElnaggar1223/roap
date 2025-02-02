"use client"

import * as React from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenuButton,
    SidebarRail,
} from "@/components/ui/sidebar"
import { ChevronDown, Loader2, LogOut } from 'lucide-react'
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog-no-close"
import { signOut } from 'next-auth/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useOnboarding } from "@/providers/onboarding-provider"
import { Collapsible, CollapsibleTrigger } from "../ui/collapsible"
import { CollapsibleContent } from "@radix-ui/react-collapsible"

export function AcademySidebar({ onboarded, ...props }: React.ComponentProps<typeof Sidebar> & { onboarded: boolean }) {
    const pathname = usePathname()

    const [loading, setLoading] = React.useState(false)

    const { completedSteps } = useOnboarding()

    const DisabledLinkAcademyWrapper = ({ children, href }: { children: React.ReactNode, href: string }) => {
        console.log(onboarded)
        if (onboarded) return <Link href={href} className='h-9 rounded-[12px] overflow-hidden w-full'>{children}</Link>

        const disabledHref =
            href.includes('/locations') && (completedSteps < 1)
            || href.includes('/coaches') && (completedSteps < 1)
            || href.includes('/programs') && (completedSteps < 3)
            || href.includes('/assessments') && (completedSteps < 3)
            || href.includes('/promo-codes') && (completedSteps < 5)

        if (disabledHref) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="h-9 rounded-[12px] overflow-hidden cursor-not-allowed opacity-40">
                                {children}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {href.includes('/locations') && <p>Finish academy details first</p>}
                            {href.includes('/coaches') && <p>Finish academy details first</p>}
                            {href.includes('/programs') && <p>Finish academy details, coaches, and locations first</p>}
                            {href.includes('/assessments') && <p>Finish academy details, coaches, programs, and locations first</p>}
                            {href.includes('/promo-codes') && <p>Finish onboarding first</p>}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }
        else return <Link href={href} className='h-9 rounded-[12px] overflow-hidden w-full'>{children}</Link>
    }

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
                        <Link prefetch={true} href='/academy' className='h-10 rounded-[12px] overflow-hidden max-lg:hidden'>
                            <SidebarMenuButton className={cn('h-full text-sm', pathname?.includes('/academy') && 'bg-[#F1F2E9]')} tooltip='Academy'>
                                <Image src='/images/academy.svg' width={20} height={20} alt='academy' />
                                <span>Academy</span>
                            </SidebarMenuButton>
                        </Link>
                        <Collapsible defaultOpen className="group/collapsible lg:hidden">
                            <SidebarGroup className='w-full p-0'>
                                <SidebarGroupLabel asChild className="w-full">
                                    <CollapsibleTrigger className='p-0 w-full'>
                                        <span className="text-sm text-black font-medium flex items-start justify-center gap-2">
                                            <Image src='/images/academy.svg' width={20} height={20} alt='academy' />
                                            Academy
                                        </span>
                                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </CollapsibleTrigger>
                                </SidebarGroupLabel>
                                <CollapsibleContent>
                                    <SidebarGroupContent>
                                        <Link href='/academy' className='h-9 rounded-[12px] overflow-hidden w-full'>
                                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname === '/academy' && 'bg-[#F1F2E9]')}>
                                                <span>Academy Details</span>
                                            </div>
                                        </Link>
                                        {/* <DisabledLinkWrapper href='/academy/sports'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/sports') && 'bg-[#F1F2E9]')}>
                                <span>Sports</span>
                            </div>
                        </DisabledLinkWrapper> */}
                                        <DisabledLinkAcademyWrapper href='/academy/locations'>
                                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/locations') && 'bg-[#F1F2E9]')}>
                                                <span>Locations</span>
                                            </div>
                                        </DisabledLinkAcademyWrapper>
                                        <DisabledLinkAcademyWrapper href='/academy/coaches'>
                                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/coaches') && 'bg-[#F1F2E9]')}>
                                                <span>Coaches</span>
                                            </div>
                                        </DisabledLinkAcademyWrapper>
                                        <DisabledLinkAcademyWrapper href='/academy/programs'>
                                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/programs') && 'bg-[#F1F2E9]')}>
                                                <span>Programs</span>
                                            </div>
                                        </DisabledLinkAcademyWrapper>
                                        <DisabledLinkAcademyWrapper href='/academy/assessments'>
                                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/assessments') && 'bg-[#F1F2E9]')}>
                                                <span>Assessments</span>
                                            </div>
                                        </DisabledLinkAcademyWrapper>
                                        <DisabledLinkAcademyWrapper href='/academy/promo-codes'>
                                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/promo-codes') && 'bg-[#F1F2E9]')}>
                                                <span>Promo Codes</span>
                                            </div>
                                        </DisabledLinkAcademyWrapper>
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            </SidebarGroup>
                        </Collapsible>
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
                        {/* <DisabledLinkWrapper href="/payment">
                            <SidebarMenuButton disabled={!onboarded} className={cn('h-full text-sm', pathname?.includes('/payment') && 'bg-[#F1F2E9]')} tooltip='Payments'>
                                <Image src='/images/payment.svg' width={20} height={20} alt='payment' />
                                <span>Payments</span>
                            </SidebarMenuButton>
                        </DisabledLinkWrapper> */}
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

